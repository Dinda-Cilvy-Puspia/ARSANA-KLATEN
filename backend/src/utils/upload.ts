import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configuration constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = /pdf|doc|docx|jpg|jpeg|png/;

/**
 * Helper to ensure upload directory exists
 */
export const ensureUploadDirExists = (dirPath: string) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

/**
 * Create a multer storage configuration with dynamic path support
 * @param subDir Subdirectory inside uploads folder (e.g., 'letters/incoming')
 */
export const createMulterStorage = (subDir: string) => {
    return multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadPath = path.join(process.cwd(), 'uploads', subDir);
            ensureUploadDirExists(uploadPath);
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
            const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
            cb(null, `${uniqueSuffix}-${sanitizedOriginalName}`);
        }
    });
};

/**
 * Common file filter for documents and images
 */
export const commonFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const isValidExtension = ALLOWED_FILE_TYPES.test(path.extname(file.originalname).toLowerCase());
    const isValidMimeType = ALLOWED_FILE_TYPES.test(file.mimetype);

    if (isValidExtension && isValidMimeType) {
        return cb(null, true);
    }
    cb(new Error('Tipe file tidak valid. Hanya PDF, DOC, DOCX, JPG, JPEG, PNG yang diizinkan.'));
};

/**
 * Factory function to create a configured multer instance
 * @param subDir Subdirectory for storage
 */
export const createUploadMiddleware = (subDir: string) => {
    return multer({
        storage: createMulterStorage(subDir),
        limits: { fileSize: MAX_FILE_SIZE },
        fileFilter: commonFileFilter
    });
};

// Export pre-configured instances if needed generally
export const uploadIncoming = createUploadMiddleware('letters/incoming');
export const uploadOutgoing = createUploadMiddleware('letters/outgoing');
