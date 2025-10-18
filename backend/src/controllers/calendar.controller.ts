import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const getCalendarEvents = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const startDate = req.query.start ? new Date(req.query.start as string) : new Date();
    const endDate = req.query.end ? new Date(req.query.end as string) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // ✅ PERBAIKAN: Query dari CalendarEvent, bukan langsung dari surat
    const calendarEvents = await prisma.calendarEvent.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        incomingLetter: {
          select: {
            letterNumber: true,
            subject: true,
            sender: true,
            recipient: true
          }
        },
        outgoingLetter: {
          select: {
            letterNumber: true,
            subject: true,
            sender: true,
            recipient: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Format events untuk frontend
    const events = calendarEvents.map(event => ({
      id: event.id,
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      description: event.description,
      type: event.incomingLetterId ? 'incoming' as const : 'outgoing' as const,
      letterNumber: event.incomingLetter?.letterNumber || event.outgoingLetter?.letterNumber,
      letterSubject: event.incomingLetter?.subject || event.outgoingLetter?.subject,
      createdAt: event.createdAt
    }));

    res.json({ events });
  } catch (error) {
    console.error('Get calendar events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUpcomingEvents = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const now = new Date();

    // ✅ PERBAIKAN: Query dari CalendarEvent dengan pagination
    const calendarEvents = await prisma.calendarEvent.findMany({
      where: {
        date: {
          gte: now
        }
      },
      include: {
        incomingLetter: {
          select: { letterNumber: true, subject: true }
        },
        outgoingLetter: {
          select: { letterNumber: true, subject: true }
        }
      },
      orderBy: { date: 'asc' },
      take: limit
    });

    const events = calendarEvents.map(event => ({
      id: event.id,
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      description: event.description,
      type: event.incomingLetterId ? 'incoming' as const : 'outgoing' as const,
      letterNumber: event.incomingLetter?.letterNumber || event.outgoingLetter?.letterNumber,
      letterSubject: event.incomingLetter?.subject || event.outgoingLetter?.subject
    }));

    res.json({ events });
  } catch (error) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};