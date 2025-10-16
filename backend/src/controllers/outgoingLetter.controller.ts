// backend/src/controllers/outgoingLetter.controller.ts

import { Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
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
    const uploadPath = path.join(process.cwd(), 'uploads/letters/outgoing');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `outgoing-${uniqueSuffix}-${sanitizedOriginalName}`);
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

const toBoolean = (val: unknown) => {
  if (typeof val === 'string') {
    return ['true', '1', 'on', 'yes'].includes(val.toLowerCase());
  }
  return Boolean(val);
};

const numberPreprocess = (val: unknown) => {
  if (typeof val === 'string' && val.trim() === '') return null;
  if (val === null || val === undefined) return null;
  const num = Number(val);
  return isNaN(num) ? val : num;
};

const outgoingLetterSchema = z.object({
  letterNumber: z.string().trim().min(1, 'Nomor surat wajib diisi'),
  createdDate: z.string().datetime('Format tanggal pembuatan tidak valid'),
  letterDate: z.string().datetime('Format tanggal surat tidak valid'),
  subject: z.string().min(1, 'Subjek wajib diisi'),
  sender: z.string().min(1, 'Pengirim wajib diisi'),
  recipient: z.string().min(1, 'Penerima wajib diisi'),
  processor: z.string().min(1, 'Pengolah wajib diisi'),
  letterNature: z.enum(['BIASA', 'TERBATAS', 'RAHASIA', 'SANGAT_RAHASIA', 'PENTING']).default('BIASA'),
  securityClass: z.enum(['BIASA']).default('BIASA'),
  executionDate: z.string().datetime().optional().nullable(),
  classificationCode: z.string().optional().nullable(),
  serialNumber: z.preprocess(
    numberPreprocess,
    z.number().int('Nomor urut harus angka').min(1, 'Nomor urut minimal 1').optional().nullable()
  ),
  note: z.string().optional().nullable(),
  isInvitation: z.preprocess(toBoolean, z.boolean()).default(false),
  eventDate: z.string().datetime().optional().nullable(),
  eventTime: z.string().optional().nullable(),
  eventLocation: z.string().optional().nullable(),
  eventNotes: z.string().optional().nullable(),
});

const updateOutgoingLetterSchema = outgoingLetterSchema.partial();

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
// 4. FUNGSI-FUNGSI CONTROLLER (CRUD) - NAMA TELAH DIPERBAIKI
// =================================================================

// ✅ PERBAIKAN: Nama fungsi diubah menjadi createOutgoingLetter
export const createOutgoingLetter = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = outgoingLetterSchema.parse(req.body);

    const letter = await prisma.outgoingLetter.create({
      data: {
        ...data,
        createdDate: new Date(data.createdDate),
        letterDate: new Date(data.letterDate),
        executionDate: data.executionDate ? new Date(data.executionDate) : null,
        eventDate: data.eventDate ? new Date(data.eventDate) : null,
        userId: req.user!.userId,
        fileName: req.file?.originalname,
        filePath: req.file ? path.join('uploads/letters/outgoing', req.file.filename) : undefined,
      },
      include: { user: { select: { id: true, name: true, email: true } } }
    });
    
    if (data.isInvitation && data.eventDate) {
      const eventDate = new Date(data.eventDate);
      await prisma.notification.create({
        data: {
          title: 'Acara Baru Ditambahkan (Surat Keluar)',
          message: `Acara "${data.subject}" telah dijadwalkan pada ${formatDate(eventDate)}`,
          type: 'INFO',
          userId: null 
        }
      });
    }

    res.status(201).json({ message: 'Surat keluar berhasil dibuat', data: letter });
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, (err) => err && logger.error("Gagal menghapus file saat pembuatan error", err));
    }
    handleError(error, res);
  }
};

// ✅ PERBAIKAN: Nama fungsi diubah menjadi getOutgoingLetters
export const getOutgoingLetters = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '9', search, category } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;
    
    const where: Prisma.OutgoingLetterWhereInput = {};
    
    if (search) {
      const searchQuery = (search as string).trim();
      where.OR = [
        { subject: { contains: searchQuery, mode: 'insensitive' } },
        { recipient: { contains: searchQuery, mode: 'insensitive' } },
        { letterNumber: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }
    
    if (category && typeof category === 'string' && ['BIASA', 'TERBATAS', 'RAHASIA', 'SANGAT_RAHASIA', 'PENTING'].includes(category)) {
      where.letterNature = category as any;
    }

    const [letters, total] = await prisma.$transaction([
      prisma.outgoingLetter.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdDate: 'desc' },
        include: { user: { select: { id: true, name: true } } }
      }),
      prisma.outgoingLetter.count({ where })
    ]);

    res.status(200).json({
      letters,
      pagination: { total, pages: Math.ceil(total / limitNum), current: pageNum, limit: limitNum }
    });
  } catch (error) {
    handleError(error, res);
  }
};

// ✅ PERBAIKAN: Nama fungsi diubah menjadi getOutgoingLetterById
export const getOutgoingLetterById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const letter = await prisma.outgoingLetter.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true } } }
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

// ✅ PERBAIKAN: Nama fungsi diubah menjadi updateOutgoingLetter
export const updateOutgoingLetter = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = updateOutgoingLetterSchema.parse(req.body);

    const existingLetter = await prisma.outgoingLetter.findUnique({ where: { id } });
    if (!existingLetter) {
      if (req.file) fs.unlink(req.file.path, err => err && logger.error("Gagal hapus file", err));
      res.status(404).json({ error: 'Surat tidak ditemukan' });
      return;
    }
    if (existingLetter.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      if (req.file) fs.unlink(req.file.path, err => err && logger.error("Gagal hapus file", err));
      res.status(403).json({ error: 'Anda tidak memiliki izin untuk mengubah surat ini' });
      return;
    }

    const updateData: Prisma.OutgoingLetterUpdateInput = {
      ...data,
      ...(data.createdDate && { createdDate: new Date(data.createdDate) }),
      ...(data.letterDate && { letterDate: new Date(data.letterDate) }),
      ...(data.executionDate && { executionDate: new Date(data.executionDate) }),
      ...(data.eventDate && { eventDate: new Date(data.eventDate) }),
    };
    
    if (req.file) {
      if (existingLetter.filePath && fs.existsSync(path.join(process.cwd(), existingLetter.filePath))) {
        fs.unlinkSync(path.join(process.cwd(), existingLetter.filePath));
      }
      updateData.fileName = req.file.originalname;
      updateData.filePath = path.join('uploads/letters/outgoing', req.file.filename);
    }

    const updatedLetter = await prisma.outgoingLetter.update({
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

// ✅ PERBAIKAN: Nama fungsi diubah menjadi deleteOutgoingLetter
export const deleteOutgoingLetter = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const letter = await prisma.outgoingLetter.findUnique({ where: { id } });

    if (!letter) {
      res.status(404).json({ error: 'Surat tidak ditemukan' });
      return;
    }
    if (letter.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Anda tidak memiliki izin untuk menghapus surat ini' });
      return;
    }

    if (letter.filePath && fs.existsSync(path.join(process.cwd(), letter.filePath))) {
      fs.unlinkSync(path.join(process.cwd(), letter.filePath));
    }
    
    await prisma.outgoingLetter.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    handleError(error, res);
  }
};