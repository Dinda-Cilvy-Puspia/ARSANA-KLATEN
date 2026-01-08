import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../utils/appError';
import logger from '../utils/logger';
import { incomingLetterService } from '../services/incomingLetter.service';
import { dispositionService } from '../services/disposition.service';
import { incomingLetterCreateSchema, incomingLetterUpdateSchema, dispositionSchema } from '../validators/incomingLetter.validator';
import { uploadIncoming } from '../utils/upload'; // Use global upload config
import { Prisma } from '@prisma/client';
import fs from 'fs';

// Export the upload middleware to be used in routes
export const upload = uploadIncoming; 

// =====================================
// HELPER: Centralized Error Handler
// =====================================
const handleError = (error: unknown, res: Response, file?: Express.Multer.File): void => {
  // Cleanup file if error occurs during processing
  if (file && file.path && fs.existsSync(file.path)) {
    try {
      fs.unlinkSync(file.path);
    } catch (cleanupError) {
      logger.error('Failed to cleanup file on error:', cleanupError);
    }
  }

  // 1. Zod Validation Errors
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

  // 2. Custom App Errors (Business Logic)
  if (error instanceof AppError) {
    logger.warn(`App error: ${error.message}`, { statusCode: error.statusCode });
    res.status(error.statusCode).json({
      error: error.message,
      ...(error.details && { details: error.details })
    });
    return;
  }

  // 3. Prisma/Database Errors (Fallback)
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    logger.error('Database error event:', error.code);
    res.status(400).json({
      error: 'Database operation failed',
      code: error.code
    });
    return;
  }

  // 4. Unexpected Errors
  logger.error('Unexpected error:', error);
  res.status(500).json({ error: 'Terjadi kesalahan pada server' });
};

// =====================================
// CONTROLLER METHODS
// =====================================

/**
 * CREATE - Create a new incoming letter
 */
export const createIncomingLetter = async (
  req: AuthenticatedRequest, 
  res: Response
): Promise<void> => {
  try {
    // Validate request body is handled inside service? 
    // Ideally validate here or service. Service in this project seems to accept raw data and validate it.
    // However, for strict controller pattern, let's validate here or pass to service which calls validator.
    // Our service (incomingLetter.service.ts) ALREADY CALLS the schema.parse().
    // So we just pass req.body.
    
    // Note: The service expects raw body and file.
    const result = await incomingLetterService.create(req.body, req.file, req.user!.userId);
    
    res.status(201).json({ 
      message: 'Surat masuk berhasil dibuat', 
      data: result 
    });
  } catch (error) {
    handleError(error, res, req.file);
  }
};

/**
 * READ - Listing with pagination
 */
export const getIncomingLetters = async (
  req: AuthenticatedRequest, 
  res: Response
): Promise<void> => {
  try {
    const params = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      search: req.query.search as string,
      category: req.query.category as any
    };

    const result = await incomingLetterService.list(params);
    const totalPages = Math.ceil(result.total / params.limit);

    res.status(200).json({
      letters: result.letters,
      pagination: {
        total: result.total,
        pages: totalPages,
        current: params.page,
        limit: params.limit,
        hasNext: params.page < totalPages,
        hasPrev: params.page > 1
      }
    });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * READ - Get Single by ID
 */
export const getIncomingLetterById = async (
  req: AuthenticatedRequest, 
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await incomingLetterService.getById(id);
    res.status(200).json({ data: result });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * UPDATE - Update existing letter
 */
export const updateIncomingLetter = async (
  req: AuthenticatedRequest, 
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await incomingLetterService.update(id, req.body, req.file, req.user!.userId);
    res.status(200).json({ 
      message: 'Surat berhasil diperbarui', 
      data: result 
    });
  } catch (error) {
    handleError(error, res, req.file);
  }
};

/**
 * DELETE - Remove letter
 */
export const deleteIncomingLetter = async (
  req: AuthenticatedRequest, 
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    await incomingLetterService.delete(id, req.user!.userId);
    res.status(204).send();
  } catch (error) {
    handleError(error, res);
  }
};

// =====================================
// DISPOSITION METHODS (Delegated to Service)
// =====================================

export const createDispositionForLetter = async (
  req: AuthenticatedRequest, 
  res: Response
): Promise<void> => {
  try {
    const { letterId } = req.params;
    
    // Validate input data
    const validatedData = dispositionSchema.parse(req.body);
    
    const result = await dispositionService.createForLetter(
        letterId, 
        validatedData, 
        req.user!.userId
    );

    res.status(201).json({ 
        message: 'Disposisi berhasil ditambahkan', 
        data: result 
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
    const result = await dispositionService.getByLetterId(letterId);
    res.status(200).json(result);
  } catch (error) {
    handleError(error, res);
  }
};
