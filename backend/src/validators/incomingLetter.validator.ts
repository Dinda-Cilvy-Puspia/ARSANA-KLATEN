import { z } from 'zod';
import { LetterNature, ProcessingMethod, DispositionTarget } from '@prisma/client';

// --- Shared Helpers ---
const booleanPreprocess = (val: unknown): boolean => {
  if (typeof val === 'string') {
    return ['true', '1', 'on', 'yes'].includes(val.toLowerCase());
  }
  return Boolean(val);
};

const datePreprocess = (val: unknown): Date | null => {
  if (!val) return null;
  try {
    return new Date(val as string);
  } catch {
    return null;
  }
};

// --- Incoming Letter Schemas ---
export const incomingLetterBaseSchema = z.object({
  letterNumber: z.string().trim().min(3, 'Nomor surat minimal 3 karakter').max(50),
  letterDate: z.preprocess(datePreprocess, z.date().optional().nullable()),
  letterNature: z.nativeEnum(LetterNature).default(LetterNature.BIASA),
  subject: z.string().min(5, 'Subjek minimal 5 karakter').max(200),
  sender: z.string().min(2).max(100),
  recipient: z.string().min(2).max(100),
  processor: z.string().min(2).max(100),
  receivedDate: z.preprocess(datePreprocess, z.date({ required_error: 'Tanggal diterima wajib diisi' })),
  processingMethod: z.nativeEnum(ProcessingMethod).default(ProcessingMethod.MANUAL),
  dispositionTarget: z.nativeEnum(DispositionTarget).optional().nullable(),
  note: z.string().max(1000).optional().nullable(),
  // Label: Undangan
  isInvitation: z.preprocess(booleanPreprocess, z.boolean()).default(false),
  eventDate: z.preprocess(datePreprocess, z.date().optional().nullable()),
  eventTime: z.string().max(20).optional().nullable(),
  eventLocation: z.string().max(200).optional().nullable(),
  eventNotes: z.string().max(1000).optional().nullable(),
  // Label: Perlu Tindakan
  needsFollowUp: z.preprocess(booleanPreprocess, z.boolean()).default(false),
  followUpDeadline: z.preprocess(datePreprocess, z.date().optional().nullable()),
});

export const incomingLetterCreateSchema = incomingLetterBaseSchema;

export const incomingLetterUpdateSchema = incomingLetterBaseSchema.partial();

export const dispositionSchema = z.object({
    dispositionTo: z.nativeEnum(DispositionTarget),
    notes: z.string().max(1000).optional().nullable()
});

export type IncomingLetterCreateInput = z.infer<typeof incomingLetterCreateSchema>;
export type IncomingLetterUpdateInput = z.infer<typeof incomingLetterUpdateSchema>;
export type DispositionInput = z.infer<typeof dispositionSchema>;
