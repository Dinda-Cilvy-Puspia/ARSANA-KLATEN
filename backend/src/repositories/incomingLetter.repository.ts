import { Prisma, IncomingLetter } from '@prisma/client';
import prisma from '../utils/prisma';

export class IncomingLetterRepository {
  // CREATE
  async create(data: Prisma.IncomingLetterCreateInput, tx?: Prisma.TransactionClient): Promise<IncomingLetter> {
    const client = tx || prisma;
    return client.incomingLetter.create({
      data,
      include: { user: { select: { id: true, name: true } } },
    });
  }

  // READ (list with pagination & filters)
  async list(params: {
    page: number;
    limit: number;
    search?: string;
    category?: string;
  }): Promise<{ letters: IncomingLetter[]; total: number }> {
    const { page, limit, search, category } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.IncomingLetterWhereInput = {};

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { sender: { contains: search, mode: 'insensitive' } },
        { letterNumber: { contains: search, mode: 'insensitive' } },
        { recipient: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) {
      where.letterNature = category as any;
    }

    const [letters, total] = await prisma.$transaction([
      prisma.incomingLetter.findMany({
        where,
        skip,
        take: limit,
        orderBy: { receivedDate: 'desc' },
        include: { user: { select: { id: true, name: true } } },
      }),
      prisma.incomingLetter.count({ where }),
    ]);
    return { letters, total };
  }

  // READ single
  async findById(id: string): Promise<IncomingLetter | null> {
    return prisma.incomingLetter.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        dispositions: {
          orderBy: { createdAt: 'desc' },
          include: { createdBy: { select: { id: true, name: true } } },
        },
        calendarEvents: {
          orderBy: { date: 'asc' },
          select: { id: true, title: true, date: true, time: true, location: true },
        },
      },
    });
  }

  // UPDATE
  async update(id: string, data: Prisma.IncomingLetterUpdateInput, tx?: Prisma.TransactionClient): Promise<IncomingLetter> {
    const client = tx || prisma;
    return client.incomingLetter.update({
      where: { id },
      data,
      include: { user: { select: { id: true, name: true } } },
    });
  }

  // DELETE
  async delete(id: string, tx?: Prisma.TransactionClient): Promise<IncomingLetter> {
    const client = tx || prisma;
    return client.incomingLetter.delete({ where: { id } });
  }
}

export const incomingLetterRepository = new IncomingLetterRepository();
