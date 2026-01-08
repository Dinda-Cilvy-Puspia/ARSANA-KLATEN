import { PrismaClient } from '@prisma/client';
import { DispositionInput } from '../validators/incomingLetter.validator';
import logger from '../utils/logger';
import { AppError } from '../utils/appError';
import prisma from '../utils/prisma';

export class DispositionService {
    async createForLetter(letterId: string, data: DispositionInput, userId: string) {
        // Validate letter exists
        const letter = await prisma.incomingLetter.findUnique({
            where: { id: letterId }
        });
        if (!letter) throw new AppError('Surat tidak ditemukan', 404);

        const disposition = await prisma.disposition.create({
            data: {
                incomingLetterId: letterId,
                dispositionTo: data.dispositionTo,
                notes: data.notes,
                createdById: userId
            },
            include: { createdBy: { select: { id: true, name: true } } }
        });

        logger.info(`Disposition created for letter ${letterId} by user ${userId}`);
        return disposition;
    }

    async getByLetterId(letterId: string) {
        return prisma.disposition.findMany({
            where: { incomingLetterId: letterId },
            orderBy: { createdAt: 'desc' },
            include: { createdBy: { select: { id: true, name: true } } }
        });
    }
}

export const dispositionService = new DispositionService();
