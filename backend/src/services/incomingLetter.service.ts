import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma'; // Use singleton
import logger from '../utils/logger';
import { AppError } from '../utils/appError';
import { incomingLetterCreateSchema, incomingLetterUpdateSchema, IncomingLetterCreateInput, IncomingLetterUpdateInput } from '../validators/incomingLetter.validator';
import { incomingLetterRepository } from '../repositories/incomingLetter.repository';
// Assuming calendar service functions can accept transaction client, or we move that logic here. 
// For now, let's keep it simple. If calendar service is not transactional aware, we might need to update it.
// To ensure atomicity, we should ideally move "createCalendarEvent" logic to a place where it can accept `tx`.
// For this step I will implement specific calendar logic inline or assume we update calendar service later. 
// Let's bring simple calendar creation logic here to ensure transaction support.

import fs from 'fs';

export class IncomingLetterService {
  // ---------- CREATE ----------
  async create(data: any, file: Express.Multer.File | undefined, userId: string) {
    const validated = incomingLetterCreateSchema.parse(data);

    // Prepare create data
    const createData: Prisma.IncomingLetterCreateInput = {
      ...validated,
      user: { connect: { id: userId } },
      fileName: file?.originalname,
      filePath: file?.path,
    };

    try {
      // Use transaction to ensure both letter and calendar event are created or neither
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create Letter via Repository (pass tx)
        const letter = await incomingLetterRepository.create(createData, tx);

        // 2. Create Calendar Event if needed
        if (validated.isInvitation && validated.eventDate) {
           await tx.calendarEvent.create({
            data: {
              title: validated.subject,
              description: `Surat Masuk: ${validated.letterNumber}\n${validated.eventNotes || ''}`,
              date: new Date(validated.eventDate),
              time: validated.eventTime || null,
              location: validated.eventLocation || null,
              type: 'MEETING',
              incomingLetterId: letter.id,
              userId: userId,
            }
          });
          logger.info(`Calendar event created for incoming letter: ${letter.id}`);
        }

        return letter;
      });

      logger.info(`Incoming letter created: ${result.id}`);
      return result;

    } catch (error) {
      // Clean up file if DB transaction failed
      if (file && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw error;
    }
  }

  // ---------- READ (list) ----------
  async list(params: any) {
    // Simply delegate to repository
    return incomingLetterRepository.list(params);
  }

  // ---------- READ (single) ----------
  async getById(id: string) {
    const letter = await incomingLetterRepository.findById(id);
    if (!letter) throw new AppError('Surat tidak ditemukan', 404);
    return letter;
  }

  // ---------- UPDATE ----------
  async update(id: string, data: any, file: Express.Multer.File | undefined, userId: string) {
    const validated = incomingLetterUpdateSchema.parse(data);
    
    // Check existence and permission
    const existing = await incomingLetterRepository.findById(id);
    if (!existing) throw new AppError('Surat tidak ditemukan', 404);
    
    // Check permission logic
    if (existing.userId !== userId) {
         // Perform admin check efficiently
         const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true }});
         if (user?.role !== 'ADMIN') {
             if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path); // cleanup new file
             throw new AppError('Anda tidak memiliki izin untuk mengubah surat ini', 403);
         }
    }

    const updateData: Prisma.IncomingLetterUpdateInput = { ...validated };
    
    // Handle file replacement
    if (file) {
      updateData.fileName = file.originalname;
      updateData.filePath = file.path;
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
             // 1. Update Letter
             const updated = await incomingLetterRepository.update(id, updateData, tx);

             // 2. Handle Calendar Event Updates
             const hasInvitationChanges =
                validated.isInvitation !== undefined ||
                validated.eventDate !== undefined ||
                validated.subject !== undefined;

             if (hasInvitationChanges) {
                // Logic: 
                // - If isInvitation became false OR eventDate gone -> delete event
                // - If event exists -> update
                // - If event not exists and isInvitation true -> create

                // Check complex logic: 'validated.isInvitation' might be undefined (not updated), so check combined state
                // We need to know the 'final' state. The 'updated' object has the final state (from Prisma return)
                const shouldHaveEvent = updated.isInvitation && updated.eventDate;
                
                // Find existing event (using tx)
                const existingEvent = await tx.calendarEvent.findFirst({ where: { incomingLetterId: id } });

                if (!shouldHaveEvent && existingEvent) {
                    await tx.calendarEvent.delete({ where: { id: existingEvent.id } });
                } else if (shouldHaveEvent) {
                    if (existingEvent) {
                        await tx.calendarEvent.update({
                            where: { id: existingEvent.id },
                            data: {
                                title: updated.subject,
                                description: `Surat Masuk: ${updated.letterNumber}\n${updated.eventNotes || ''}`,
                                date: new Date(updated.eventDate!),
                                time: updated.eventTime,
                                location: updated.eventLocation,
                            }
                        });
                    } else {
                        await tx.calendarEvent.create({
                            data: {
                                title: updated.subject,
                                description: `Surat Masuk: ${updated.letterNumber}\n${updated.eventNotes || ''}`,
                                date: new Date(updated.eventDate!),
                                time: updated.eventTime,
                                location: updated.eventLocation,
                                type: 'MEETING',
                                incomingLetterId: updated.id,
                                userId: userId,
                            }
                        });
                    }
                }
             }

             return updated;
        });

        // Cleanup OLD file only after transaction success
        if (file && existing.filePath && existing.filePath !== file.path) {
             this.deletePhysicalFile(existing.filePath);
        }

        logger.info(`Incoming letter updated: ${id}`);
        return result;

    } catch (error) {
        // Cleanup NEW file if transaction failed
        if (file && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
        throw error;
    }
  }

  // ---------- DELETE ----------
  async delete(id: string, userId: string) {
    const existing = await incomingLetterRepository.findById(id);
    if (!existing) throw new AppError('Surat tidak ditemukan', 404);

    if (existing.userId !== userId) {
         const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true }});
         if (user?.role !== 'ADMIN') {
             throw new AppError('Anda tidak memiliki izin untuk menghapus surat ini', 403);
         }
    }

    try {
        await prisma.$transaction(async (tx) => {
            // Calendar events cascade delete usually, but we can be explicit if needed.
            // Assuming schema has onDelete: Cascade for calendarEvents -> incomingLetter (checked schema, it does)
            
            await incomingLetterRepository.delete(id, tx);
        });

        // Cleanup file only after DB delete success
        if (existing.filePath) {
            await this.deletePhysicalFile(existing.filePath);
        }

        logger.info(`Incoming letter deleted: ${id}`);
    } catch (error) {
        throw error;
    }
  }

  // ---------- HELPERS ----------
  private async deletePhysicalFile(filePath: string) {
    if (!filePath || !fs.existsSync(filePath)) return;
    try {
      fs.unlinkSync(filePath);
      logger.info(`File deleted: ${filePath}`);
    } catch (e) {
      logger.error(`Failed to delete file: ${filePath}`, e);
    }
  }
}

export const incomingLetterService = new IncomingLetterService();
