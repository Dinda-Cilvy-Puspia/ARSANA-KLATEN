import { Router } from 'express';
import {
  createIncomingLetter,
  getIncomingLetters,
  getIncomingLetterById,
  updateIncomingLetter,
  deleteIncomingLetter,
  upload // Impor konfigurasi multer dari controller
} from '../controllers/incomingLetter.controller';

import { authenticate as auth } from '../middleware/auth'; // Asumsi lokasi middleware auth

// Inisialisasi router dari Express
const router = Router();

/**
 * =================================================================================
 * RUTE UNTUK SURAT MASUK (INCOMING LETTERS)
 * =================================================================================
 * Semua rute di sini akan memiliki prefix, contohnya: /api/incoming-letters
 */

/**
 * @route   POST /api/incoming-letters
 * @desc    Membuat surat masuk baru
 * @access  Private (membutuhkan autentikasi)
 * @middleware auth, upload.single('file')
 * - auth: Memastikan pengguna sudah login.
 * - upload.single('file'): Menangani upload satu file dengan nama field 'file'.
 */
router.post('/', auth, upload.single('file'), createIncomingLetter);

/**
 * @route   GET /api/incoming-letters
 * @desc    Mendapatkan semua surat masuk dengan paginasi dan filter
 * @access  Private (membutuhkan autentikasi)
 */
router.get('/', auth, getIncomingLetters);

/**
 * @route   GET /api/incoming-letters/:id
 * @desc    Mendapatkan detail satu surat masuk berdasarkan ID
 * @access  Private (membutuhkan autentikasi)
 */
router.get('/:id', auth, getIncomingLetterById);

/**
 * @route   PUT /api/incoming-letters/:id
 * @desc    Memperbarui data surat masuk berdasarkan ID
 * @access  Private (membutuhkan autentikasi)
 * @middleware auth, upload.single('file')
 * - auth: Memastikan pengguna sudah login.
 * - upload.single('file'): Menangani kemungkinan adanya file baru yang di-upload saat update.
 */
router.put('/:id', auth, upload.single('file'), updateIncomingLetter);

/**
 * @route   DELETE /api/incoming-letters/:id
 * @desc    Menghapus surat masuk berdasarkan ID
 * @access  Private (membutuhkan autentikasi)
 */
router.delete('/:id', auth, deleteIncomingLetter);

// Ekspor router agar bisa digunakan di file utama server (misalnya: server.ts atau index.ts)
export default router;