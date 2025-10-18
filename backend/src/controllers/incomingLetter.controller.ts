import { Response } from 'express';
import { PrismaClient, Prisma, LetterNature, DispositionMethod } from '@prisma/client';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import logger from '../utils/logger';

const prisma = new PrismaClient();

// =====================================
// 1. KONSTANTA & KONFIGURASI
// =====================================

const ALLOWED_FILE_TYPES = /pdf|doc|docx|jpg|jpeg|png/;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

// =====================================
// 2. KONFIGURASI MULTER (SINGLETON PATTERN)
// =====================================

const createMulterConfig = () => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, '../../uploads/letters/incoming');
      fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, `incoming-${uniqueSuffix}-${sanitizedOriginalName}`);
    }
  });

  return multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
      const isValidExtension = ALLOWED_FILE_TYPES.test(
        path.extname(file.originalname).toLowerCase()
      );
      const isValidMimeType = ALLOWED_FILE_TYPES.test(file.mimetype);
      
      if (isValidExtension && isValidMimeType) {
        return cb(null, true);
      }
      
      cb(new Error('Tipe file tidak valid. Hanya PDF, DOC, DOCX, JPG, JPEG, PNG yang diizinkan.'));
    }
  });
};

export const upload = createMulterConfig();

// =====================================
// 3. SCHEMA VALIDATION (ZOD)
// =====================================

const booleanPreprocess = (val: unknown): boolean => {
  if (typeof val === 'string') {
    return ['true', '1', 'on', 'yes'].includes(val.toLowerCase());
  }
  return Boolean(val);
};

const datePreprocess = (val: unknown): Date | null => {
  if (!val) return null;
  try {
    return new Date(val as string);
  } catch {
    return null;
  }
};

// Base schema untuk validasi surat masuk
const incomingLetterBaseSchema = {
  letterNumber: z.string()
    .trim()
    .min(3, 'Nomor surat minimal 3 karakter')
    .max(50, 'Nomor surat maksimal 50 karakter'),
  
  letterDate: z.preprocess(datePreprocess, z.date().optional().nullable()),
  
  letterNature: z.nativeEnum(LetterNature).default('BIASA'),
  
  subject: z.string()
    .min(5, 'Subjek minimal 5 karakter')
    .max(200, 'Subjek maksimal 200 karakter'),
  
  sender: z.string()
    .min(2, 'Pengirim minimal 2 karakter')
    .max(100, 'Pengirim maksimal 100 karakter'),
  
  recipient: z.string()
    .min(2, 'Penerima minimal 2 karakter')
    .max(100, 'Penerima maksimal 100 karakter'),
  
  processor: z.string()
    .min(2, 'Pengolah minimal 2 karakter')
    .max(100, 'Pengolah maksimal 100 karakter'),
  
  receivedDate: z.preprocess(datePreprocess, z.date({ required_error: 'Tanggal diterima wajib diisi' })),
  
  dispositionMethod: z.nativeEnum(DispositionMethod),
  
  dispositionTarget: z.string().min(1, "Tujuan disposisi wajib diisi"),
  
  note: z.string().max(1000, 'Keterangan maksimal 1000 karakter').optional().nullable(),
  
  isInvitation: z.preprocess(booleanPreprocess, z.boolean()).default(false),
  
  eventDate: z.preprocess(datePreprocess, z.date().optional().nullable()),
  
  eventTime: z.string().max(20).optional().nullable(),
  
  eventLocation: z.string().max(200).optional().nullable(),
  
  eventNotes: z.string().max(1000).optional().nullable(),
  
  needsFollowUp: z.preprocess(booleanPreprocess, z.boolean()).default(false),
  
  followUpDeadline: z.preprocess(datePreprocess, z.date().optional().nullable()),
};

// Schema untuk create
const incomingLetterCreateSchema = z.object(incomingLetterBaseSchema);

// Schema untuk update (semua field optional)
const incomingLetterUpdateSchema = z.object(
  Object.fromEntries(
    Object.entries(incomingLetterBaseSchema).map(([key, value]) => [
      key, 
      value.optional().nullable()
    ])
  )
);

// Schema untuk disposisi
const dispositionSchema = z.object({
  dispositionTo: z.enum([
    'UMPEG', 'PERENCANAAN', 'KAUR_KEUANGAN', 'KABID', 
    'BIDANG1', 'BIDANG2', 'BIDANG3', 'BIDANG4', 'BIDANG5'
  ]),
  notes: z.string().max(1000, 'Catatan disposisi maksimal 1000 karakter').optional().nullable()
});

// =====================================
// 4. SERVICE FUNCTIONS (BUSINESS LOGIC)
// =====================================

/**
 * Membuat calendar event dari surat undangan
 */
// =====================================
// 4. SERVICE FUNCTIONS (BUSINESS LOGIC)
// =====================================

/**
 * Membuat calendar event dari surat undangan
 */
const createCalendarEventFromLetter = async (
  letter: any, 
  userId: string
): Promise<void> => {
  if (!letter.isInvitation || !letter.eventDate) return;

  try {
    await prisma.calendarEvent.create({
      data: {
        title: letter.subject,
        description: `Surat Masuk: ${letter.letterNumber}\n${letter.eventNotes || ''}`,
        date: new Date(letter.eventDate),
        time: letter.eventTime || null,
        location: letter.eventLocation || null,
        type: 'MEETING',
        incomingLetterId: letter.id,
        userId: userId,
      }
    });
    
    logger.info(`Calendar event created for incoming letter: ${letter.id}`);
  } catch (error) {
    logger.error('Failed to create calendar event:', error);
  }
};

/**
 * Update calendar event ketika surat di-update
 */
const updateCalendarEventFromLetter = async (
  letter: any,
  userId: string
): Promise<void> => {
  if (!letter.isInvitation || !letter.eventDate) {
    // Jika bukan undangan lagi, hapus calendar event yang ada
    await deleteCalendarEventByLetterId(letter.id);
    return;
  }

  try {
    // Cari existing calendar event
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: { incomingLetterId: letter.id }
    });

    if (existingEvent) {
      // Update existing event
      await prisma.calendarEvent.update({
        where: { id: existingEvent.id },
        data: {
          title: letter.subject,
          description: `Surat Masuk: ${letter.letterNumber}\n${letter.eventNotes || ''}`,
          date: new Date(letter.eventDate),
          time: letter.eventTime || null,
          location: letter.eventLocation || null,
          type: 'MEETING',
          // Reset notification flags karena event berubah
          notified3Days: false,
          notified1Day: false,
        }
      });
      logger.info(`Calendar event updated for incoming letter: ${letter.id}`);
    } else {
      // Buat baru jika tidak ada
      await createCalendarEventFromLetter(letter, userId);
    }
  } catch (error) {
    logger.error('Failed to update calendar event:', error);
  }
};

/**
 * Hapus calendar event berdasarkan letter ID
 */
const deleteCalendarEventByLetterId = async (letterId: string): Promise<void> => {
  try {
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: { incomingLetterId: letterId }
    });

    if (existingEvent) {
      await prisma.calendarEvent.delete({
        where: { id: existingEvent.id }
      });
      logger.info(`Calendar event deleted for incoming letter: ${letterId}`);
    }
  } catch (error) {
    logger.error('Failed to delete calendar event:', error);
  }
};

/**
 * Menghapus file fisik dari sistem
 */
const deletePhysicalFile = async (filePath: string): Promise<void> => {
  if (!filePath || !fs.existsSync(filePath)) return;

  try {
    fs.unlinkSync(filePath);
    logger.info(`File deleted: ${filePath}`);
  } catch (error) {
    logger.error(`Failed to delete file: ${filePath}`, error);
  }
};

/**
 * Cleanup file jika operasi gagal
 */
const cleanupFileOnError = (file: Express.Multer.File | undefined): void => {
  if (!file?.path) return;

  try {
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  } catch (error) {
    logger.error('Failed to cleanup file on error:', error);
  }
};

// =====================================
// 5. ERROR HANDLER (CENTRALIZED)
// =====================================

class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

const handleError = (error: unknown, res: Response): void => {
  // Zod Validation Error
  if (error instanceof z.ZodError) {
    const details = error.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));
    
    logger.warn('Validation error:', { details });
    res.status(400).json({
      error: 'Data yang dimasukkan tidak valid',
      details
    });
    return;
  }

  // Prisma Known Errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        const target = (error.meta?.target as string[])?.join(', ') || 'data';
        logger.warn(`Duplicate entry: ${target}`);
        res.status(409).json({ 
          error: `Data '${target}' sudah ada dalam sistem.` 
        });
        return;
        
      case 'P2025':
        logger.warn('Record not found:', error.meta);
        res.status(404).json({ error: 'Data tidak ditemukan' });
        return;
        
      default:
        logger.error('Prisma error:', error);
        res.status(500).json({ error: 'Terjadi kesalahan database' });
        return;
    }
  }

  // Custom App Error
  if (error instanceof AppError) {
    logger.warn('App error:', { message: error.message, statusCode: error.statusCode });
    res.status(error.statusCode).json({ 
      error: error.message,
      ...(error.details && { details: error.details })
    });
    return;
  }

  // Unknown Error
  logger.error('Unexpected error:', error);
  res.status(500).json({ error: 'Terjadi kesalahan pada server' });
};

// =====================================
// 6. CONTROLLER FUNCTIONS
// =====================================

/**
 * CREATE - Membuat surat masuk baru
 */
export const createIncomingLetter = async (
  req: AuthenticatedRequest, 
  res: Response
): Promise<void> => {
  try {
    const validatedData = incomingLetterCreateSchema.parse(req.body);
    const userId = req.user!.userId;

    const letter = await prisma.incomingLetter.create({
      data: {
        ...validatedData,
        userId,
        fileName: req.file?.originalname,
        filePath: req.file?.path,
      },
      include: { 
        user: { 
          select: { id: true, name: true } 
        } 
      }
    });

    // Auto-create calendar event untuk undangan
    if (validatedData.isInvitation) {
      await createCalendarEventFromLetter(letter, userId);
    }

    logger.info(`Incoming letter created: ${letter.id} by user: ${userId}`);
    
    res.status(201).json({ 
      message: 'Surat masuk berhasil dibuat', 
      data: letter 
    });

  } catch (error) {
    cleanupFileOnError(req.file);
    handleError(error, res);
  }
};

/**
 * UPDATE - Memperbarui surat masuk
 */
export const updateIncomingLetter = async (
  req: AuthenticatedRequest, 
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const validatedData = incomingLetterUpdateSchema.parse(req.body);
    const userId = req.user!.userId;

    // Cek keberadaan dan kepemilikan surat
    const existingLetter = await prisma.incomingLetter.findUnique({ 
      where: { id },
      include: {
        calendarEvents: {
          select: { id: true }
        }
      }
    });

    if (!existingLetter) {
      throw new AppError('Surat tidak ditemukan', 404);
    }

    if (existingLetter.userId !== userId && req.user!.role !== 'ADMIN') {
      throw new AppError('Anda tidak memiliki izin untuk mengubah surat ini', 403);
    }

    // Persiapkan data update
    const updateData: Prisma.IncomingLetterUpdateInput = { ...validatedData };

    // Handle file upload
    if (req.file) {
      // Hapus file lama jika ada
      if (existingLetter.filePath) {
        await deletePhysicalFile(existingLetter.filePath);
      }
      
      updateData.fileName = req.file.originalname;
      updateData.filePath = req.file.path;
    }

    const updatedLetter = await prisma.incomingLetter.update({
      where: { id },
      data: updateData,
      include: { 
        user: { 
          select: { id: true, name: true } 
        } 
      }
    });

    // ✅ PERBAIKAN: Update calendar event jika ada perubahan terkait undangan
    const hasInvitationChanges = 
      validatedData.isInvitation !== undefined ||
      validatedData.eventDate !== undefined ||
      validatedData.subject !== undefined ||
      validatedData.eventLocation !== undefined ||
      validatedData.eventNotes !== undefined;

    if (hasInvitationChanges) {
      await updateCalendarEventFromLetter(updatedLetter, userId);
    }

    logger.info(`Incoming letter updated: ${id} by user: ${userId}`);
    
    res.status(200).json({ 
      message: 'Surat berhasil diperbarui', 
      data: updatedLetter 
    });

  } catch (error) {
    cleanupFileOnError(req.file);
    handleError(error, res);
  }
};

/**
 * READ - Mendapatkan daftar surat masuk dengan pagination dan filter
 */
export const getIncomingLetters = async (
  req: AuthenticatedRequest, 
  res: Response
): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      MAX_PAGE_SIZE, 
      Math.max(1, parseInt(req.query.limit as string) || DEFAULT_PAGE_SIZE)
    );
    const skip = (page - 1) * limit;
    
    const search = (req.query.search as string)?.trim();
    const category = req.query.category as LetterNature;

    // Build where clause
    const where: Prisma.IncomingLetterWhereInput = {};
    
    // Search filter
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { sender: { contains: search, mode: 'insensitive' } },
        { letterNumber: { contains: search, mode: 'insensitive' } },
        { recipient: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Category filter
    if (category && Object.values(LetterNature).includes(category)) {
      where.letterNature = category;
    }

    // Execute query dengan transaction untuk consistency
    const [letters, total] = await prisma.$transaction([
      prisma.incomingLetter.findMany({
        where,
        skip,
        take: limit,
        orderBy: { receivedDate: 'desc' },
        include: { 
          user: { 
            select: { id: true, name: true } 
          } 
        }
      }),
      prisma.incomingLetter.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      letters,
      pagination: {
        total,
        pages: totalPages,
        current: page,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    handleError(error, res);
  }
};

/**
 * READ - Mendapatkan surat masuk by ID
 */
export const getIncomingLetterById = async (
  req: AuthenticatedRequest, 
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const letter = await prisma.incomingLetter.findUnique({
      where: { id },
      include: {
        user: { 
          select: { id: true, name: true, email: true } 
        },
        dispositions: {
          orderBy: { createdAt: 'desc' },
          include: { 
            createdBy: { 
              select: { id: true, name: true } 
            } 
          }
        },
        calendarEvents: {
          orderBy: { date: 'asc' },
          select: {
            id: true,
            title: true,
            date: true,
            time: true,
            location: true
          }
        }
      }
    });

    if (!letter) {
      throw new AppError('Surat tidak ditemukan', 404);
    }

    res.status(200).json({ data: letter });

  } catch (error) {
    handleError(error, res);
  }
};

/**
 * DELETE - Menghapus surat masuk
 */
export const deleteIncomingLetter = async (
  req: AuthenticatedRequest, 
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const existingLetter = await prisma.incomingLetter.findUnique({ 
      where: { id } 
    });

    if (!existingLetter) {
      throw new AppError('Surat tidak ditemukan', 404);
    }

    if (existingLetter.userId !== userId && req.user!.role !== 'ADMIN') {
      throw new AppError('Anda tidak memiliki izin untuk menghapus surat ini', 403);
    }

    // ✅ PERBAIKAN: Hapus calendar event terkait
    await deleteCalendarEventByLetterId(id);

    // Hapus file fisik jika ada
    if (existingLetter.filePath) {
      await deletePhysicalFile(existingLetter.filePath);
    }
    
    // Hapus dari database (cascade akan handle related records)
    await prisma.incomingLetter.delete({ where: { id } });

    logger.info(`Incoming letter deleted: ${id} by user: ${userId}`);
    
    res.status(204).send();

  } catch (error) {
    handleError(error, res);
  }
};

// =====================================
// 7. DISPOSITION CONTROLLERS
// =====================================

export const createDispositionForLetter = async (
  req: AuthenticatedRequest, 
  res: Response
): Promise<void> => {
  try {
    const { letterId } = req.params;
    const validatedData = dispositionSchema.parse(req.body);
    const userId = req.user!.userId;

    // Verify letter exists
    const letter = await prisma.incomingLetter.findUnique({ 
      where: { id: letterId } 
    });

    if (!letter) {
      throw new AppError('Surat tidak ditemukan', 404);
    }

    const disposition = await prisma.disposition.create({
      data: {
        incomingLetterId: letterId,
        dispositionTo: validatedData.dispositionTo,
        notes: validatedData.notes,
        createdById: userId,
      },
      include: { 
        createdBy: { 
          select: { id: true, name: true } 
        } 
      }
    });

    logger.info(`Disposition created for letter: ${letterId} by user: ${userId}`);
    
    res.status(201).json({ 
      message: 'Disposisi berhasil ditambahkan', 
      data: disposition 
    });

  } catch (error) {
    handleError(error, res);
  }
};

export const getDispositionsForLetter = async (
  req: AuthenticatedRequest, 
  res: Response
): Promise<void> => {
  try {
    const { letterId } = req.params;

    const dispositions = await prisma.disposition.findMany({
      where: { incomingLetterId: letterId },
      orderBy: { createdAt: 'desc' },
      include: { 
        createdBy: { 
          select: { id: true, name: true } 
        } 
      }
    });

    res.status(200).json(dispositions);

  } catch (error) {
    handleError(error, res);
  }
};