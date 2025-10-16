import { Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';
import { formatDate } from '../utils/helpers';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// =====================================
// Multer Configuration
// =====================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/letters/incoming');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `incoming-${uniqueSuffix}-${sanitizedOriginalName}`);
  }
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPG, JPEG, PNG files are allowed.'));
  }
});

// =====================================
// Helper Functions
// =====================================
const toBoolean = (val: unknown) => {
  if (typeof val === 'string') {
    const v = val.trim().toLowerCase();
    if (['true', '1', 'on', 'yes'].includes(v)) return true;
    if (['false', '0', 'off', 'no', ''].includes(v)) return false;
  }
  return val;
};

// =====================================
// Validation Schemas
// =====================================
const incomingLetterSchema = z.object({
  // Basic letter information
  letterNumber: z.string()
    .trim()
    .min(3, 'Nomor surat minimal 3 karakter')
    .max(50, 'Nomor surat maksimal 50 karakter')
    .regex(/^[A-Za-z0-9\-\/\.]+$/, 'Nomor surat hanya boleh berisi huruf, angka, tanda hubung, garis miring, dan titik'),
  letterDate: z.string().datetime('Format tanggal surat tidak valid').optional().nullable(),
  letterNature: z.enum(['BIASA', 'TERBATAS', 'RAHASIA', 'SANGAT_RAHASIA', 'PENTING'], {
    errorMap: () => ({ message: 'Sifat surat tidak valid' })
  }).default('BIASA'),
  subject: z.string()
    .min(5, 'Subjek minimal 5 karakter')
    .max(200, 'Subjek maksimal 200 karakter'),
  sender: z.string()
    .min(2, 'Nama pengirim minimal 2 karakter')
    .max(100, 'Nama pengirim maksimal 100 karakter'),
  recipient: z.string()
    .min(2, 'Nama penerima minimal 2 karakter')
    .max(100, 'Nama penerima maksimal 100 karakter'),
  processor: z.string()
    .min(2, 'Nama pengolah minimal 2 karakter')
    .max(100, 'Nama pengolah maksimal 100 karakter'),
  note: z.string()
    .max(1000, 'Keterangan maksimal 1000 karakter')
    .optional()
    .nullable(),
  receivedDate: z.string()
    .datetime()
    .refine((date) => {
      const receivedDate = new Date(date);
      const now = new Date();
      return receivedDate <= now;
    }, 'Tanggal diterima tidak boleh di masa depan'),

  // Invitation specific fields
  isInvitation: z.preprocess(toBoolean, z.boolean()).default(false),
  eventDate: z.string()
    .datetime('Format tanggal acara tidak valid')
    .optional()
    .nullable(),
  eventTime: z.string()
    .max(20, 'Waktu acara maksimal 20 karakter')
    .optional()
    .nullable(),
  eventLocation: z.string()
    .max(200, 'Lokasi acara maksimal 200 karakter')
    .optional()
    .nullable(),
  eventNotes: z.string()
    .max(1000, 'Catatan acara maksimal 1000 karakter')
    .optional()
    .nullable(),

  // Follow-up and disposition fields
  needsFollowUp: z.preprocess(toBoolean, z.boolean()).default(false),
  followUpDeadline: z.string()
    .datetime('Format tanggal tidak valid')
    .optional()
    .nullable(),
  dispositionMethod: z.enum(['MANUAL', 'SRIKANDI'])
    .optional()
    .nullable(),
  srikandiDispositionNumber: z.string()
    .max(100, 'Nomor disposisi Srikandi maksimal 100 karakter')
    .optional()
    .nullable()
}).refine((data) => {
  // Validation for invitation dates
  if (data.isInvitation && !data.eventDate) return false;
  if (data.eventDate && data.receivedDate) {
    const eventDate = new Date(data.eventDate);
    const receivedDate = new Date(data.receivedDate);
    return eventDate > receivedDate;
  }
  return true;
}, {
  message: 'Untuk undangan, tanggal acara wajib diisi dan harus setelah tanggal diterima',
  path: ['eventDate']
});

const updateIncomingLetterSchema = z.object({
  // Basic letter information
  letterNumber: z.string()
    .min(3)
    .max(50)
    .regex(/^[A-Za-z0-9\-\/\.]+$/)
    .optional(),
  letterDate: z.string()
    .datetime('Format tanggal surat tidak valid')
    .optional()
    .nullable(),
  letterNature: z.enum(['BIASA', 'TERBATAS', 'RAHASIA', 'SANGAT_RAHASIA', 'PENTING'])
    .optional(),
  subject: z.string().min(5).max(200).optional(),
  sender: z.string().min(2).max(100).optional(),
  recipient: z.string().min(2).max(100).optional(),
  processor: z.string().min(2).max(100).optional(),
  note: z.string().max(1000).optional().nullable(),
  receivedDate: z.string().datetime('Format tanggal tidak valid').optional(),

  // Invitation specific fields
  isInvitation: z.preprocess(toBoolean, z.boolean()).optional(),
  eventDate: z.string()
    .datetime('Format tanggal acara tidak valid')
    .optional()
    .nullable(),
  eventTime: z.string().max(20).optional().nullable(),
  eventLocation: z.string().max(200).optional().nullable(),
  eventNotes: z.string().max(1000).optional().nullable(),

  // Follow-up and disposition fields
  needsFollowUp: z.preprocess(toBoolean, z.boolean()).optional(),
  followUpDeadline: z.string()
    .datetime('Format tanggal tidak valid')
    .optional()
    .nullable(),
  dispositionMethod: z.enum(['MANUAL', 'SRIKANDI']).optional().nullable(),
  srikandiDispositionNumber: z.string().max(100).optional().nullable()
});

const dispositionSchema = z.object({
  dispositionTo: z.enum([
    'UMPEG', 'PERENCANAAN', 'KAUR_KEUANGAN', 'KABID', 
    'BIDANG1', 'BIDANG2', 'BIDANG3', 'BIDANG4', 'BIDANG5'
  ]),
  notes: z.string().max(1000, 'Catatan disposisi maksimal 1000 karakter').optional().nullable()
});


// =====================================
// Controller Functions
// =====================================
export const createIncomingLetter = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Validate input data
    const data = incomingLetterSchema.parse(req.body);

    // Prepare letter data
    const letterData = {
      ...data,
      letterDate: data.letterDate ? new Date(data.letterDate) : null,
      receivedDate: new Date(data.receivedDate),
      eventDate: data.eventDate ? new Date(data.eventDate) : null,
      followUpDeadline: data.followUpDeadline ? new Date(data.followUpDeadline) : null,
      userId: req.user!.userId,
      fileName: req.file?.originalname || null,
      filePath: req.file?.path || null
    };

    // Create letter
    const letter = await prisma.incomingLetter.create({
      data: letterData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Create notification for invitation if applicable
    if (data.isInvitation && data.eventDate) {
      const eventDate = new Date(data.eventDate);
      const daysBefore = Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      if (daysBefore > 0 && daysBefore <= 30) {
        await prisma.notification.create({
          data: {
            title: 'Acara Baru Ditambahkan',
            message: `Acara "${data.subject}" telah dijadwalkan pada tanggal ${formatDate(eventDate)} oleh ${letter.user.name}`,
            type: 'INFO',
            userId: null // Global notification
          }
        });
      }
    }

    res.status(201).json({
      message: 'Surat masuk berhasil dibuat',
      data: letter
    });
  } catch (error) {
    handleError(error, res);
  }
};

export const updateIncomingLetter = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = updateIncomingLetterSchema.parse(req.body);

    // Check letter existence
    const existingLetter = await prisma.incomingLetter.findUnique({
      where: { id }
    });

    if (!existingLetter) {
      res.status(404).json({ error: 'Letter not found' });
      return;
    }

    // Check authorization
    if (existingLetter.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    // Prepare update data
    const updateData: any = {
      ...(data.letterNumber && { letterNumber: data.letterNumber }),
      ...(data.letterDate !== undefined && { letterDate: data.letterDate ? new Date(data.letterDate) : null }),
      ...(data.letterNature && { letterNature: data.letterNature }),
      ...(data.subject && { subject: data.subject }),
      ...(data.sender && { sender: data.sender }),
      ...(data.recipient && { recipient: data.recipient }),
      ...(data.processor && { processor: data.processor }),
      ...(data.note !== undefined && { note: data.note || null }),
      ...(data.receivedDate && { receivedDate: new Date(data.receivedDate) }),
      ...(data.isInvitation !== undefined && { isInvitation: data.isInvitation }),
      ...(data.eventDate !== undefined && { eventDate: data.eventDate ? new Date(data.eventDate) : null }),
      ...(data.eventTime !== undefined && { eventTime: data.eventTime || null }),
      ...(data.eventLocation !== undefined && { eventLocation: data.eventLocation || null }),
      ...(data.eventNotes !== undefined && { eventNotes: data.eventNotes || null }),
      ...(data.needsFollowUp !== undefined && { needsFollowUp: data.needsFollowUp }),
      ...(data.followUpDeadline !== undefined && { followUpDeadline: data.followUpDeadline ? new Date(data.followUpDeadline) : null }),
      ...(data.dispositionMethod !== undefined && { dispositionMethod: data.dispositionMethod }),
      ...(data.srikandiDispositionNumber !== undefined && { srikandiDispositionNumber: data.srikandiDispositionNumber })
    };

    // Handle file upload
    if (req.file) {
      if (existingLetter.filePath && fs.existsSync(existingLetter.filePath)) {
        fs.unlinkSync(existingLetter.filePath);
      }
      updateData.fileName = req.file.originalname;
      updateData.filePath = req.file.path;
    }

    // Update letter
    const letter = await prisma.incomingLetter.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json(letter);
  } catch (error) {
    handleError(error, res);
  }
};

export const getIncomingLetters = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const letterNature = req.query.letterNature as string;
    const needsFollowUp = req.query.needsFollowUp === 'true';
    
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    // Basic search filters
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { sender: { contains: search, mode: 'insensitive' } },
        { recipient: { contains: search, mode: 'insensitive' } },
        { processor: { contains: search, mode: 'insensitive' } },
        { letterNumber: { contains: search, mode: 'insensitive' } },
        // Tambahan search untuk disposisi
        { srikandiDispositionNumber: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Filter berdasarkan sifat surat
    if (letterNature) {
      where.letterNature = letterNature;
    }

    // Filter baru untuk tindak lanjut
    if (needsFollowUp) {
      where.needsFollowUp = true;
      where.followUpDeadline = {
        gte: new Date() // Hanya yang belum melewati deadline
      };
    }

    const [letters, total] = await Promise.all([
      prisma.incomingLetter.findMany({
        where,
        skip,
        take: limit,
        orderBy: { receivedDate: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          dispositions: {
            include: {
              incomingLetter: {
                select: {
                  id: true,
                  letterNumber: true,
                  subject: true
                }
              }
            }
          }
        }
      }),
      prisma.incomingLetter.count({ where })
    ]);

    res.json({
      letters,
      pagination: {
        current: page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get incoming letters error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getIncomingLetterById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const letter = await prisma.incomingLetter.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        dispositions: {
          include: {
            incomingLetter: {
              select: {
                id: true,
                letterNumber: true,
                subject: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!letter) {
      res.status(404).json({ error: 'Letter not found' });
      return;
    }

    res.json(letter);
  } catch (error) {
    console.error('Get incoming letter error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteIncomingLetter = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existingLetter = await prisma.incomingLetter.findUnique({
      where: { id }
    });

    if (!existingLetter) {
      res.status(404).json({ error: 'Letter not found' });
      return;
    }

    // Check if user owns the letter or is admin
    if (existingLetter.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    // Delete associated file
    if (existingLetter.filePath && fs.existsSync(existingLetter.filePath)) {
      fs.unlinkSync(existingLetter.filePath);
    }

    // Delete any related dispositions first
    await prisma.disposition.deleteMany({
      where: { incomingLetterId: id }
    });

    // Delete the letter
    await prisma.incomingLetter.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete incoming letter error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// =====================================
// Disposition Controller Functions
// =====================================

export const createDispositionForLetter = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { letterId } = req.params;
    const data = dispositionSchema.parse(req.body);

    // Check if letter exists
    const letter = await prisma.incomingLetter.findUnique({ where: { id: letterId } });
    if (!letter) {
      res.status(404).json({ error: 'Surat tidak ditemukan' });
      return;
    }

    const disposition = await prisma.disposition.create({
      data: {
        incomingLetterId: letterId,
        dispositionTo: data.dispositionTo,
        notes: data.notes,
        createdById: req.user!.userId,
      },
      include: {
        createdBy: { select: { id: true, name: true } }
      }
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
            include: {
                createdBy: { select: { id: true, name: true } }
            }
        });

        res.json(dispositions);

    } catch (error) {
        handleError(error, res);
    }
};


// =====================================
// Additional Utility Functions
// =====================================

// Function to check upcoming deadlines and create notifications
export const checkFollowUpDeadlines = async (): Promise<void> => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const letters = await prisma.incomingLetter.findMany({
      where: {
        needsFollowUp: true,
        followUpDeadline: {
          gte: new Date(),
          lt: tomorrow
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    for (const letter of letters) {
      await prisma.notification.create({
        data: {
          title: 'Deadline Tindak Lanjut',
          message: `Surat "${letter.subject}" perlu ditindaklanjuti sebelum ${formatDate(letter.followUpDeadline!)}`,
          type: 'WARNING',
          userId: letter.userId
        }
      });
    }
  } catch (error) {
    console.error('Check follow-up deadlines error:', error);
  }
};

// Function to sync with Srikandi system (placeholder)
export const syncWithSrikandi = async (letterId: string): Promise<void> => {
  try {
    const letter = await prisma.incomingLetter.findUnique({
      where: { id: letterId }
    });

    if (!letter || letter.dispositionMethod !== 'SRIKANDI') {
      return;
    }

    // TODO: Implement actual Srikandi integration
    console.log('Syncing with Srikandi:', letter.srikandiDispositionNumber);
  } catch (error) {
    console.error('Srikandi sync error:', error);
  }
};

// Export additional types if needed
export type IncomingLetterWithRelations = Prisma.IncomingLetterGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    dispositions: {
      include: {
        incomingLetter: {
          select: {
            id: true;
            letterNumber: true;
            subject: true;
          };
        };
      };
    };
  };
}>;

// =====================================
// Error Handler
// =====================================
const handleError = (error: any, res: Response) => {
  if (error instanceof z.ZodError) {
    const formattedErrors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }));
    
    res.status(400).json({
      error: 'Data yang dimasukkan tidak valid',
      details: formattedErrors
    });
    return;
  }

  if ((error as any).code === 'P2002') {
    res.status(400).json({
      error: 'Data sudah ada dalam sistem',
      details: [{
        field: (error as any).meta?.target?.[0] || 'unknown',
        message: 'Data dengan nilai tersebut sudah ada'
      }]
    });
    return;
  }

  console.error('Operation error:', error);
  res.status(500).json({
    error: 'Terjadi kesalahan pada server',
    message: 'Silakan coba lagi nanti'
  });
};