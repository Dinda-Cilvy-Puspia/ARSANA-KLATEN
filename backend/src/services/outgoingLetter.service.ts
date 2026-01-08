// src/services/outgoingLetter.service.ts
import { PrismaClient, Prisma, LetterNature, SecurityClass } from '@prisma/client';
import { z } from 'zod';
import logger from '../utils/logger';
import { AppError } from '../utils/appError';
import { createCalendarEventFromLetter, updateCalendarEventFromLetter, deleteCalendarEventByLetterId } from './calendar.service';
import fs from 'fs';
import path from 'path';
import { formatDate } from '../utils/helpers';

// Reuse Zod schemas in a shared way if possible, or define here for now to ensure consistency with service layer pattern
const toBoolean = (val: unknown) => {
  if (typeof val === 'string') return ['true', '1', 'on', 'yes'].includes(val.toLowerCase());
  return Boolean(val);
};

const numberPreprocess = (val: unknown) => {
  if (typeof val === 'string' && val.trim() === '') return null;
  if (val === null || val === undefined) return null;
  const num = Number(val);
  return isNaN(num) ? val : num;
};

// Base schema
const outgoingLetterBaseSchema = {
  letterNumber: z.string().trim().min(3).max(50),
  letterDate: z.string().or(z.date()).transform(val => new Date(val)),
  createdDate: z.string().or(z.date()).transform(val => new Date(val)),
  subject: z.string().min(1),
  sender: z.string().min(1),
  recipient: z.string().min(1),
  processor: z.string().min(1),
  letterNature: z.nativeEnum(LetterNature).default(LetterNature.BIASA),
  securityClass: z.nativeEnum(SecurityClass).default(SecurityClass.BIASA),
  executionDate: z.string().or(z.date()).optional().nullable().transform(val => val ? new Date(val) : null),
  classificationCode: z.string().optional().nullable(),
  serialNumber: z.preprocess(numberPreprocess, z.number().int().optional().nullable()),
  note: z.string().optional().nullable(),
  isInvitation: z.preprocess(toBoolean, z.boolean()).default(false),
  eventDate: z.string().or(z.date()).optional().nullable().transform(val => val ? new Date(val) : null),
  eventTime: z.string().optional().nullable(),
  eventLocation: z.string().optional().nullable(),
  eventNotes: z.string().optional().nullable(),
};

const outgoingLetterCreateSchema = z.object(outgoingLetterBaseSchema);
const outgoingLetterUpdateSchema = z.object(
  Object.fromEntries(
    Object.entries(outgoingLetterBaseSchema).map(([k, v]) => [k, v instanceof z.ZodDefault ? v.optional() : v.optional().nullable()])
  )
);

export class OutgoingLetterService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  // CREATE
  async create(data: any, file: Express.Multer.File | undefined, userId: string) {
    // 1. Validate input
    const validated = outgoingLetterCreateSchema.parse(data);

    // 2. Prepare data for Prisma
    // Ensure enums are correctly typed. Zod handles validation, but we cast to standard Prisma types just in case.
    const createData: Prisma.OutgoingLetterCreateInput = {
      ...validated,
      user: { connect: { id: userId } }, // Relation
      fileName: file?.originalname,
      filePath: file?.path,
      // Handle optional enums explicitly if needed, though validated object should have them correct
      letterNature: validated.letterNature as LetterNature,
      securityClass: validated.securityClass as SecurityClass,
    };

    const letter = await this.prisma.outgoingLetter.create({
      data: createData,
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    // 3. Side effects (Calendar Event & Notification)
    if (validated.isInvitation && validated.eventDate) {
      // Use shared calendar service logic (assuming it handles Outgoing too or we adapt it)
      // The shared function `createCalendarEventFromLetter` in `calendar.service.ts` expects an object with letter props.
      // We might need to adjust it if it strictly looks for `incomingLetterId`.
      // Let's look at `calendar.service.ts` again. It sets `incomingLetterId`.
      // We need a version for `outgoingLetterId`.
      await this.handleCalendarEvent(letter, userId);
    }

    logger.info(`Outgoing letter created: ${letter.id}`);
    return letter;
  }

  // READ (List)
  async list(params: any) {
    const { page = 1, limit = 10, search, category } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.OutgoingLetterWhereInput = {};

    if (search) {
      const s = search.trim();
      where.OR = [
        { subject: { contains: s, mode: 'insensitive' } },
        { recipient: { contains: s, mode: 'insensitive' } },
        { letterNumber: { contains: s, mode: 'insensitive' } },
      ];
    }

    if (category && Object.values(LetterNature).includes(category)) {
      where.letterNature = category as LetterNature;
    }

    const [letters, total] = await this.prisma.$transaction([
      this.prisma.outgoingLetter.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdDate: 'desc' },
        include: { user: { select: { id: true, name: true } } },
      }),
      this.prisma.outgoingLetter.count({ where }),
    ]);

    return { letters, total };
  }

  // READ (Single)
  async getById(id: string) {
    const letter = await this.prisma.outgoingLetter.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (!letter) throw new AppError('Surat tidak ditemukan', 404);
    return letter;
  }

  // UPDATE
  async update(id: string, data: any, file: Express.Multer.File | undefined, userId: string, isAdmin: boolean) {
    const existing = await this.prisma.outgoingLetter.findUnique({ where: { id } });
    if (!existing) throw new AppError('Surat tidak ditemukan', 404);
    
    if (existing.userId !== userId && !isAdmin) {
      throw new AppError('Anda tidak memiliki izin untuk mengubah surat ini', 403);
    }

    const validated = outgoingLetterUpdateSchema.parse(data); // Partial validation

    const updateData: Prisma.OutgoingLetterUpdateInput = {
      ...validated,
    };

    if (file) {
      if (existing.filePath) this.deletePhysicalFile(existing.filePath);
      updateData.fileName = file.originalname;
      updateData.filePath = file.path;
    }

    const updated = await this.prisma.outgoingLetter.update({
      where: { id },
      data: updateData,
      include: { user: { select: { id: true, name: true } } },
    });

    // Handle calendar updates if relevant fields changed
    const hasInvitationChanges =
      validated.isInvitation !== undefined ||
      validated.eventDate !== undefined ||
      validated.subject !== undefined;

    if (hasInvitationChanges) {
      // Logic to update/delete calendar event
      // Reuse logic similar to incoming but for outgoing
      await this.handleCalendarEventUpdate(updated, userId);
    }

    return updated;
  }

  // DELETE
  async delete(id: string, userId: string, isAdmin: boolean) {
    const existing = await this.prisma.outgoingLetter.findUnique({ where: { id } });
    if (!existing) throw new AppError('Surat tidak ditemukan', 404);
    
    if (existing.userId !== userId && !isAdmin) {
      throw new AppError('Anda tidak memiliki izin untuk menghapus surat ini', 403);
    }

    if (existing.filePath) this.deletePhysicalFile(existing.filePath);

    // Prisma cascade should handle calendar events if configured, otherwise needs manual deletion
    // Schema says: `outgoingLetter OutgoingLetter? @relation(fields: [outgoingLetterId], references: [id], onDelete: Cascade)`
    // So distinct manual deletion of event is not strictly required for DB integrity, but might be good for cleanliness.
    
    await this.prisma.outgoingLetter.delete({ where: { id } });
  }

  // --- Helpers ---

  private deletePhysicalFile(filePath: string) {
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        logger.error(`Failed to delete file: ${filePath}`, e);
      }
    }
  }

  // Specialized calendar handler for Outgoing (could be moved to calendar.service if generified)
  private async handleCalendarEvent(letter: any, userId: string) {
     if (!letter.isInvitation || !letter.eventDate) return;
     try {
       await this.prisma.calendarEvent.create({
         data: {
            title: letter.subject,
            description: `Surat Keluar: ${letter.letterNumber}\n${letter.eventNotes || ''}`,
            date: new Date(letter.eventDate),
            time: letter.eventTime || null,
            location: letter.eventLocation || null,
            type: 'MEETING',
            outgoingLetterId: letter.id, // Important differnece
            userId: userId,
         }
       });
       
       // Create notification
       await this.prisma.notification.create({
          data: {
            title: 'Acara Baru (Surat Keluar)',
            message: `Acara "${letter.subject}" dijadwalkan pada ${formatDate(letter.eventDate)}`,
            type: 'INFO',
            // global notification (userId null) or specific? Controller code had userId: null
            userId: null 
          }
       });

     } catch (e) {
       logger.error('Failed to create calendar event/notification for outgoing letter', e);
     }
  }

  private async handleCalendarEventUpdate(letter: any, userId: string) {
     // Check if invitation is still true
     if (!letter.isInvitation || !letter.eventDate) {
        // Delete event if exists
        const event = await this.prisma.calendarEvent.findFirst({ where: { outgoingLetterId: letter.id } });
        if (event) await this.prisma.calendarEvent.delete({ where: { id: event.id } });
        return;
     }

     // Update or Create
     const existingEvent = await this.prisma.calendarEvent.findFirst({ where: { outgoingLetterId: letter.id } });
     if (existingEvent) {
       await this.prisma.calendarEvent.update({
         where: { id: existingEvent.id },
         data: {
            title: letter.subject,
            description: `Surat Keluar: ${letter.letterNumber}\n${letter.eventNotes || ''}`,
            date: new Date(letter.eventDate),
            time: letter.eventTime || null,
            location: letter.eventLocation || null,
         }
       });
     } else {
       await this.handleCalendarEvent(letter, userId);
     }
  }
}

export const outgoingLetterService = new OutgoingLetterService(new PrismaClient());
