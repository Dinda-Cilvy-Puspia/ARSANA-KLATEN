import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';
import { formatDate } from '../utils/helpers';

const prisma = new PrismaClient();

const dispositionSchema = z.object({
  incomingLetterId: z.string().uuid('ID surat masuk tidak valid'),
  recipient: z.string()
    .min(2, 'Nama penerima disposisi minimal 2 karakter')
    .max(100, 'Nama penerima disposisi maksimal 100 karakter'),
  instruction: z.string()
    .min(5, 'Instruksi minimal 5 karakter')
    .max(1000, 'Instruksi maksimal 1000 karakter'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], {
    errorMap: () => ({ message: 'Prioritas tidak valid' })
  }).default('MEDIUM'),
  dueDate: z.string()
    .datetime('Format tanggal tidak valid')
    .optional()
    .nullable(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], {
    errorMap: () => ({ message: 'Status tidak valid' })
  }).default('PENDING'),
  notes: z.string()
    .max(1000, 'Catatan maksimal 1000 karakter')
    .optional()
    .nullable()
});

const updateDispositionSchema = z.object({
  recipient: z.string()
    .min(2, 'Nama penerima disposisi minimal 2 karakter')
    .max(100, 'Nama penerima disposisi maksimal 100 karakter')
    .optional(),
  instruction: z.string()
    .min(5, 'Instruksi minimal 5 karakter')
    .max(1000, 'Instruksi maksimal 1000 karakter')
    .optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .optional(),
  dueDate: z.string()
    .datetime('Format tanggal tidak valid')
    .optional()
    .nullable(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    .optional(),
  notes: z.string()
    .max(1000, 'Catatan maksimal 1000 karakter')
    .optional()
    .nullable()
});

export const createDisposition = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = dispositionSchema.parse(req.body);

    // Check if incoming letter exists
    const incomingLetter = await prisma.incomingLetter.findUnique({
      where: { id: data.incomingLetterId },
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

    if (!incomingLetter) {
      res.status(404).json({ 
        error: 'Surat masuk tidak ditemukan',
        details: [{ field: 'incomingLetterId', message: 'ID surat masuk tidak valid' }]
      });
      return;
    }

    // Create disposition
    const disposition = await prisma.disposition.create({
      data: {
        incomingLetterId: data.incomingLetterId,
        recipient: data.recipient,
        instruction: data.instruction,
        priority: data.priority || 'MEDIUM',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: data.status || 'PENDING',
        notes: data.notes || null,
        createdById: req.user!.userId
      },
      include: {
        incomingLetter: {
          select: {
            id: true,
            letterNumber: true,
            subject: true,
            sender: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Create notification for disposition recipient (if different from creator)
    if (data.recipient !== req.user!.name) {
      await prisma.notification.create({
        data: {
          title: 'Disposisi Baru',
          message: `Anda mendapat disposisi baru untuk surat "${incomingLetter.subject}" dari ${req.user!.name}`,
          type: 'INFO',
          userId: null // Global notification - in production, find user by name and assign
        }
      });
    }

    res.status(201).json({
      message: 'Disposisi berhasil dibuat',
      data: disposition
    });
  } catch (error) {
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
    
    console.error('Create disposition error:', error);
    res.status(500).json({ 
      error: 'Terjadi kesalahan pada server', 
      message: 'Silakan coba lagi nanti' 
    });
  }
};

export const getAllDispositions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const priority = req.query.priority as string;
    
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (priority) {
      where.priority = priority;
    }

    const [dispositions, total] = await Promise.all([
      prisma.disposition.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          incomingLetter: {
            select: {
              id: true,
              letterNumber: true,
              subject: true,
              sender: true,
              receivedDate: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.disposition.count({ where })
    ]);

    res.json({
      dispositions,
      pagination: {
        current: page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all dispositions error:', error);
    res.status(500).json({ 
      error: 'Terjadi kesalahan pada server',
      message: 'Gagal mengambil data disposisi'
    });
  }
};

export const getDisposition = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const disposition = await prisma.disposition.findUnique({
      where: { id },
      include: {
        incomingLetter: {
          select: {
            id: true,
            letterNumber: true,
            subject: true,
            sender: true,
            recipient: true,
            receivedDate: true,
            letterNature: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!disposition) {
      res.status(404).json({ 
        error: 'Disposisi tidak ditemukan',
        message: 'ID disposisi tidak valid atau telah dihapus'
      });
      return;
    }

    res.json(disposition);
  } catch (error) {
    console.error('Get disposition error:', error);
    res.status(500).json({ 
      error: 'Terjadi kesalahan pada server',
      message: 'Gagal mengambil detail disposisi'
    });
  }
};

export const getDispositionsByLetter = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { letterId } = req.params;

    // Check if letter exists
    const letter = await prisma.incomingLetter.findUnique({
      where: { id: letterId }
    });

    if (!letter) {
      res.status(404).json({ 
        error: 'Surat masuk tidak ditemukan',
        message: 'ID surat tidak valid atau telah dihapus'
      });
      return;
    }

    const dispositions = await prisma.disposition.findMany({
      where: { incomingLetterId: letterId },
      orderBy: { createdAt: 'desc' },
      include: {
        incomingLetter: {
          select: {
            id: true,
            letterNumber: true,
            subject: true,
            sender: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      dispositions,
      total: dispositions.length
    });
  } catch (error) {
    console.error('Get dispositions by letter error:', error);
    res.status(500).json({ 
      error: 'Terjadi kesalahan pada server',
      message: 'Gagal mengambil disposisi surat'
    });
  }
};

export const updateDisposition = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = updateDispositionSchema.parse(req.body);

    const existingDisposition = await prisma.disposition.findUnique({
      where: { id },
      include: {
        incomingLetter: {
          select: {
            subject: true
          }
        }
      }
    });

    if (!existingDisposition) {
      res.status(404).json({ 
        error: 'Disposisi tidak ditemukan',
        message: 'ID disposisi tidak valid atau telah dihapus'
      });
      return;
    }

    // Check if user has permission to update
    if (existingDisposition.createdById !== req.user!.userId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ 
        error: 'Tidak memiliki akses',
        message: 'Anda tidak memiliki izin untuk mengubah disposisi ini'
      });
      return;
    }

    const updateData: any = {
      ...(data.recipient && { recipient: data.recipient }),
      ...(data.instruction && { instruction: data.instruction }),
      ...(data.priority && { priority: data.priority }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
      ...(data.status && { status: data.status }),
      ...(data.notes !== undefined && { notes: data.notes || null })
    };

    const disposition = await prisma.disposition.update({
      where: { id },
      data: updateData,
      include: {
        incomingLetter: {
          select: {
            id: true,
            letterNumber: true,
            subject: true,
            sender: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Create notification if status changed to COMPLETED
    if (data.status === 'COMPLETED' && existingDisposition.status !== 'COMPLETED') {
      await prisma.notification.create({
        data: {
          title: 'Disposisi Selesai',
          message: `Disposisi untuk surat "${existingDisposition.incomingLetter.subject}" telah diselesaikan`,
          type: 'SUCCESS',
          userId: null // Global notification
        }
      });
    }

    res.json({
      message: 'Disposisi berhasil diperbarui',
      data: disposition
    });
  } catch (error) {
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
    
    console.error('Update disposition error:', error);
    res.status(500).json({ 
      error: 'Terjadi kesalahan pada server',
      message: 'Gagal memperbarui disposisi'
    });
  }
};

export const deleteDisposition = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existingDisposition = await prisma.disposition.findUnique({
      where: { id }
    });

    if (!existingDisposition) {
      res.status(404).json({ 
        error: 'Disposisi tidak ditemukan',
        message: 'ID disposisi tidak valid atau telah dihapus'
      });
      return;
    }

    // Check if user has permission to delete
    if (existingDisposition.createdById !== req.user!.userId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ 
        error: 'Tidak memiliki akses',
        message: 'Anda tidak memiliki izin untuk menghapus disposisi ini'
      });
      return;
    }

    await prisma.disposition.delete({
      where: { id }
    });

    res.status(200).json({
      message: 'Disposisi berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete disposition error:', error);
    res.status(500).json({ 
      error: 'Terjadi kesalahan pada server',
      message: 'Gagal menghapus disposisi'
    });
  }
};