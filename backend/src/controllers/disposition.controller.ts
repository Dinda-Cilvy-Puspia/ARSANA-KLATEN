import { Response } from 'express';
import { PrismaClient, DispositionType } from '@prisma/client';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// ✅ Validasi data sesuai schema baru
const dispositionSchema = z.object({
  incomingLetterId: z.string().uuid('ID surat masuk tidak valid'),
  dispositionTo: z.nativeEnum(DispositionType, {
    errorMap: () => ({ message: 'Tujuan disposisi tidak valid' })
  }),
  notes: z.string().max(1000, 'Catatan maksimal 1000 karakter').optional().nullable()
});

const updateDispositionSchema = z.object({
  dispositionTo: z.nativeEnum(DispositionType).optional(),
  notes: z.string().max(1000, 'Catatan maksimal 1000 karakter').optional().nullable()
});

// ✅ CREATE
export const createDisposition = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = dispositionSchema.parse(req.body);

    const incomingLetter = await prisma.incomingLetter.findUnique({
      where: { id: data.incomingLetterId }
    });

    if (!incomingLetter) {
      res.status(404).json({
        error: 'Surat masuk tidak ditemukan',
        details: [{ field: 'incomingLetterId', message: 'ID surat masuk tidak valid' }]
      });
      return;
    }

    const disposition = await prisma.disposition.create({
      data: {
        incomingLetterId: data.incomingLetterId,
        dispositionTo: data.dispositionTo,
        notes: data.notes || null
      },
      include: {
        incomingLetter: {
          select: {
            id: true,
            letterNumber: true,
            subject: true,
            sender: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Disposisi berhasil dibuat',
      data: disposition
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Data yang dimasukkan tidak valid',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
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

// ✅ GET ALL
export const getAllDispositions = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const dispositions = await prisma.disposition.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        incomingLetter: {
          select: {
            id: true,
            letterNumber: true,
            subject: true,
            sender: true
          }
        }
      }
    });

    res.json({ dispositions, total: dispositions.length });
  } catch (error) {
    console.error('Get all dispositions error:', error);
    res.status(500).json({
      error: 'Terjadi kesalahan pada server',
      message: 'Gagal mengambil data disposisi'
    });
  }
};

// ✅ GET BY ID
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
            recipient: true
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

// ✅ GET BY LETTER
export const getDispositionsByLetter = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { letterId } = req.params;

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
        }
      }
    });

    res.json({ dispositions, total: dispositions.length });
  } catch (error) {
    console.error('Get dispositions by letter error:', error);
    res.status(500).json({
      error: 'Terjadi kesalahan pada server',
      message: 'Gagal mengambil disposisi surat'
    });
  }
};

// ✅ UPDATE
export const updateDisposition = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = updateDispositionSchema.parse(req.body);

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

    const disposition = await prisma.disposition.update({
      where: { id },
      data: {
        ...(data.dispositionTo && { dispositionTo: data.dispositionTo }),
        ...(data.notes !== undefined && { notes: data.notes || null })
      },
      include: {
        incomingLetter: {
          select: {
            id: true,
            letterNumber: true,
            subject: true,
            sender: true
          }
        }
      }
    });

    res.json({
      message: 'Disposisi berhasil diperbarui',
      data: disposition
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Data yang dimasukkan tidak valid',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
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

// ✅ DELETE
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

    await prisma.disposition.delete({ where: { id } });

    res.status(200).json({ message: 'Disposisi berhasil dihapus' });
  } catch (error) {
    console.error('Delete disposition error:', error);
    res.status(500).json({
      error: 'Terjadi kesalahan pada server',
      message: 'Gagal menghapus disposisi'
    });
  }
};
