import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Membuat calendar event dari surat undangan
 */
export const createCalendarEventFromLetter = async (
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
export const updateCalendarEventFromLetter = async (
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
export const deleteCalendarEventByLetterId = async (letterId: string): Promise<void> => {
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
