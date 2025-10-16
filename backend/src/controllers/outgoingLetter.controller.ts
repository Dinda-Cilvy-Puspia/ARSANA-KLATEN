// backend/src/controllers/incomingLetter.controller.ts

import { Response } from 'express';
import { PrismaClient, Prisma, LetterNature } from '@prisma/client';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import logger from '../utils/logger';
import { formatDate } from '../utils/helpers';

const prisma = new PrismaClient();

// =================================================================
// 1. KONFIGURASI MULTER
// =================================================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Menggunakan process.cwd() untuk path yang lebih andal dari root proyek
    const uploadPath = path.join(process.cwd(), 'uploads/letters/incoming');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `incoming-${uniqueSuffix}-${sanitizedOriginalName}`);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Tipe file tidak valid. Hanya PDF, DOC, DOCX, JPG, JPEG, PNG yang diizinkan.'));
  }
});

// =================================================================
// 2. SKEMA VALIDASI ZOD
// =================================================================

const booleanPreprocess = (val: unknown) => {
  if (typeof val === 'string') {
    return ['true', '1', 'on', 'yes'].includes(val.toLowerCase());
  }
  return Boolean(val);
};

// Skema untuk membuat surat masuk, disesuaikan dengan file asli Anda + perbaikan .trim()
const incomingLetterSchema = z.object({
  letterNumber: z.string().trim().min(3, 'Nomor surat minimal 3 karakter').max(50, 'Nomor surat maksimal 50 karakter'),
  letterDate: z.string().datetime('Format tanggal surat tidak valid').optional().nullable(),
  letterNature: z.nativeEnum(LetterNature).default('BIASA'),
  subject: z.string().trim().min(5, 'Subjek minimal 5 karakter').max(200, 'Subjek maksimal 200 karakter'),
  sender: z.string().trim().min(2, 'Pengirim minimal 2 karakter').max(100, 'Pengirim maksimal 100 karakter'),
  recipient: z.string().trim().min(2, 'Penerima minimal 2 karakter').max(100, 'Penerima maksimal 100 karakter'),
  processor: z.string().trim().min(2, 'Pengolah minimal 2 karakter').max(100, 'Pengolah maksimal 100 karakter'),
  receivedDate: z.string().datetime('Format tanggal diterima tidak valid'),
  dispositionMethod: z.enum(['MANUAL', 'SRIKANDI']),
  dispositionTarget: z.string().min(1, "Tujuan disposisi wajib diisi"),
  note: z.string().max(1000, 'Keterangan maksimal 1000 karakter').optional().nullable(),
  isInvitation: z.preprocess(booleanPreprocess, z.boolean()).default(false),
  eventDate: z.string().datetime().optional().nullable(),
  eventTime: z.string().max(20).optional().nullable(),
  eventLocation: z.string().max(200).optional().nullable(),
  eventNotes: z.string().max(1000).optional().nullable(),
  needsFollowUp: z.preprocess(booleanPreprocess, z.boolean()).default(false),
  followUpDeadline: z.string().datetime().optional().nullable(),
});

// Skema untuk update, semua field menjadi opsional
const updateIncomingLetterSchema = incomingLetterSchema.partial();

// Skema untuk disposisi, diambil dari file asli Anda
const dispositionSchema = z.object({
  dispositionTo: z.enum([
    'UMPEG', 'PERENCANAAN', 'KAUR_KEUANGAN', 'KABID', 
    'BIDANG1', 'BIDANG2', 'BIDANG3', 'BIDANG4', 'BIDANG5'
  ]),
  notes: z.string().max(1000, 'Catatan disposisi maksimal 1000 karakter').optional().nullable()
});

// =================================================================
// 3. FUNGSI BANTUAN PENANGANAN ERROR
// =================================================================
const handleError = (error: unknown, res: Response): void => {
  if (error instanceof z.ZodError) {
    logger.warn('Validation failed:', { errors: error.errors });
    res.status(400).json({
      error: 'Data yang dimasukkan tidak valid',
      details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    });
    return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    const target = (error.meta?.target as string[])?.join(', ');
    logger.warn(`Duplicate entry for: ${target}`);
    res.status(409).json({ error: `Nomor surat '${target}' sudah ada.` });
    return;
  }
  logger.error('An unexpected error occurred:', error);
  res.status(500).json({ error: 'Terjadi kesalahan pada server' });
};

// =================================================================
// 4. FUNGSI CONTROLLER SURAT MASUK (CRUD)
// =================================================================

export const createIncomingLetter = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = incomingLetterSchema.parse(req.body);
    const letter = await prisma.incomingLetter.create({
      data: {
        ...data,
        letterDate: data.letterDate ? new Date(data.letterDate) : null,
        receivedDate: new Date(data.receivedDate),
        eventDate: data.eventDate ? new Date(data.eventDate) : null,
        followUpDeadline: data.followUpDeadline ? new Date(data.followUpDeadline) : null,
        userId: req.user!.userId,
        fileName: req.file?.originalname,
        // Menggunakan path relatif yang andal
        filePath: req.file ? path.join('uploads/letters/incoming', req.file.filename) : undefined,
      },
      include: { user: { select: { id: true, name: true, email: true } } }
    });

    // Membuat notifikasi jika surat adalah undangan atau perlu tindak lanjut
    if (data.isInvitation && data.eventDate) {
      await prisma.notification.create({
        data: {
          title: 'Undangan Baru Diterima',
          message: `Anda memiliki undangan untuk acara "${data.subject}" pada ${formatDate(new Date(data.eventDate))}`,
          type: 'INFO',
          userId: null, // Global
        },
      });
    }
    if (data.needsFollowUp && data.followUpDeadline) {
      await prisma.notification.create({
        data: {
          title: 'Surat Perlu Tindak Lanjut',
          message: `Surat "${data.subject}" perlu ditindaklanjuti sebelum ${formatDate(new Date(data.followUpDeadline))}`,
          type: 'WARNING',
          userId: null, // Global
        },
      });
    }

    res.status(201).json({ message: 'Surat masuk berhasil dibuat', data: letter });
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, (err) => err && logger.error("Gagal hapus file saat pembuatan error", err));
    }
    handleError(error, res);
  }
};

export const getIncomingLetters = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '9', search, category } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;
    
    const where: Prisma.IncomingLetterWhereInput = {};
    
    if (search) {
      const searchQuery = (search as string).trim();
      where.OR = [
        { subject: { contains: searchQuery, mode: 'insensitive' } },
        { sender: { contains: searchQuery, mode: 'insensitive' } },
        { letterNumber: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }
    
    if (category && typeof category === 'string' && Object.values(LetterNature).includes(category as LetterNature)) {
      where.letterNature = category as LetterNature;
    }

    const [letters, total] = await prisma.$transaction([
      prisma.incomingLetter.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { receivedDate: 'desc' },
        include: { user: { select: { id: true, name: true } } }
      }),
      prisma.incomingLetter.count({ where })
    ]);

    res.status(200).json({
      letters,
      pagination: { total, pages: Math.ceil(total / limitNum), current: pageNum, limit: limitNum }
    });
  } catch (error) {
    handleError(error, res);
  }
};

export const getIncomingLetterById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const letter = await prisma.incomingLetter.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        dispositions: {
          orderBy: { createdAt: 'desc' },
          include: { createdBy: { select: { id: true, name: true } } }
        }
      }
    });

    if (!letter) {
      res.status(404).json({ error: 'Surat tidak ditemukan' });
      return;
    }

    res.status(200).json({ data: letter });
  } catch (error) {
    handleError(error, res);
  }
};

export const updateIncomingLetter = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = updateIncomingLetterSchema.parse(req.body);

    const existingLetter = await prisma.incomingLetter.findUnique({ where: { id } });
    if (!existingLetter) {
      if (req.file) fs.unlink(req.file.path, err => err && logger.error("Gagal hapus file", err));
      res.status(404).json({ error: 'Surat tidak ditemukan' });
      return;
    }
    if (existingLetter.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      if (req.file) fs.unlink(req.file.path, err => err && logger.error("Gagal hapus file", err));
      res.status(403).json({ error: 'Akses ditolak' });
      return;
    }

    const updateData: Prisma.IncomingLetterUpdateInput = {
      ...data,
      ...(data.letterDate && { letterDate: new Date(data.letterDate) }),
      ...(data.receivedDate && { receivedDate: new Date(data.receivedDate) }),
      ...(data.eventDate && { eventDate: new Date(data.eventDate) }),
      ...(data.followUpDeadline && { followUpDeadline: new Date(data.followUpDeadline) }),
    };
    
    if (req.file) {
      if (existingLetter.filePath && fs.existsSync(path.join(process.cwd(), existingLetter.filePath))) {
        fs.unlinkSync(path.join(process.cwd(), existingLetter.filePath));
      }
      updateData.fileName = req.file.originalname;
      updateData.filePath = path.join('uploads/letters/incoming', req.file.filename);
    }

    const updatedLetter = await prisma.incomingLetter.update({
      where: { id },
      data: updateData,
      include: { user: { select: { id: true, name: true, email: true } } }
    });

    res.status(200).json({ message: 'Surat berhasil diperbarui', data: updatedLetter });
  } catch (error) {
    if (req.file) fs.unlink(req.file.path, err => err && logger.error("Gagal hapus file saat update", err));
    handleError(error, res);
  }
};

export const deleteIncomingLetter = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const letter = await prisma.incomingLetter.findUnique({ where: { id } });

    if (!letter) {
      res.status(404).json({ error: 'Surat tidak ditemukan' });
      return;
    }
    if (letter.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Akses ditolak' });
      return;
    }

    // `onDelete: Cascade` di schema.prisma akan otomatis menghapus disposisi terkait
    await prisma.incomingLetter.delete({ where: { id } });
    
    if (letter.filePath && fs.existsSync(path.join(process.cwd(), letter.filePath))) {
      fs.unlinkSync(path.join(process.cwd(), letter.filePath));
    }
    
    res.status(204).send();
  } catch (error) {
    handleError(error, res);
  }
};

// =================================================================
// 5. FUNGSI CONTROLLER DISPOSISI (DARI FILE ASLI ANDA)
// =================================================================

export const createDispositionForLetter = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { letterId } = req.params;
    const data = dispositionSchema.parse(req.body);

    const letter = await prisma.incomingLetter.findUnique({ where: { id: letterId } });
    if (!letter) {
      res.status(404).json({ error: 'Surat tidak ditemukan untuk disposisi' });
      return;
    }

    const disposition = await prisma.disposition.create({
      data: {
        incomingLetterId: letterId,
        dispositionTo: data.dispositionTo,
        notes: data.notes,
        createdById: req.user!.userId,
      },
      include: { createdBy: { select: { id: true, name: true } } }
    });

    res.status(201).json({ message: 'Disposisi berhasil ditambahkan', data: disposition });
  } catch (error) {
    handleError(error, res);
  }
};

export const getDispositionsForLetter = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { letterId } = req.params;
    const dispositions = await prisma.disposition.findMany({
      where: { incomingLetterId: letterId },
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { id: true, name: true } } }
    });
    // Mengirim data langsung karena frontend (DispositionManager) mungkin mengharapkan array
    res.status(200).json(dispositions);
  } catch (error) {
    handleError(error, res);
  }
};