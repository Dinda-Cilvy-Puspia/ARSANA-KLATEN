// backend/src/app.ts

import express, { Express } from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import listEndpoints from 'express-list-endpoints';

// Impor rute
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import incomingLetterRoutes from './routes/incomingLetter.routes';
import outgoingLetterRoutes from './routes/outgoingLetter.routes';
import dispositionRoutes from './routes/disposition.routes';
import notificationRoutes from './routes/notification.routes';
import calendarRoutes from './routes/calendar.routes';
import fileRoutes from './routes/file.routes';

// Impor middleware
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { requestLogger, detailedRequestLogger } from './middleware/requestLogger';

// Impor service dan utilitas
import { startCronJobs } from './services/cronService';
import logger, { devLogger } from './utils/logger';

const app: Express = express();
const prisma = new PrismaClient();

// Inisialisasi direktori logs dan uploads
const logsDir = path.join(__dirname, '../logs');
const uploadsDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Middleware Logging
app.use(requestLogger());
app.use(detailedRequestLogger);

// Middleware Keamanan
app.use(helmet());

// Konfigurasi Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: process.env.NODE_ENV === 'production' ? 100 : 2000,
  message: { error: 'Terlalu banyak permintaan dari IP ini, silakan coba lagi nanti.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, _, options) => {
    logger.warn('Rate limit exceeded', { ip: req.ip, path: req.path });
    res.status(options.statusCode).send(options.message);
  },
  // [PENTING] Mengabaikan rate limit untuk permintaan dari localhost
  skip: (req) => req.ip === '::1' || req.ip === '127.0.0.1',
});
app.use(limiter);

// Konfigurasi CORS
const allowedOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : ['http://localhost:3000'];
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Akses diblokir oleh kebijakan CORS'));
    }
  },
  credentials: true,
  exposedHeaders: ['Content-Disposition'],
};
app.use(cors(corsOptions));

// Middleware Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware untuk menyajikan file statis dari direktori 'uploads'
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// =================================================================
// Definisi Rute API (DIKEMBALIKAN KE VERSI ASLI)
// =================================================================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/incoming-letters', incomingLetterRoutes); // <-- DIKEMBALIKAN
app.use('/api/outgoing-letters', outgoingLetterRoutes); // <-- DIKEMBALIKAN
app.use('/api/dispositions', dispositionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/files', fileRoutes);

// Rute Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Middleware Penanganan Error
app.use(notFoundHandler);
app.use(errorHandler);

// Memulai Cron Jobs
if (process.env.NODE_ENV !== 'test') {
  startCronJobs();
  logger.info('Cron jobs started');
}

// Fungsi Graceful Shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} diterima, server akan dimatikan...`);
  try {
    await prisma.$disconnect();
    logger.info('Koneksi database berhasil ditutup.');
    process.exit(0);
  } catch (error) {
    logger.error('Error saat graceful shutdown:', error);
    process.exit(1);
  }
};
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

const PORT = process.env.PORT || 5000;

// Fungsi tes koneksi database
async function testDbConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info("✅ Koneksi database berhasil.");
  } catch (err) {
    logger.error("❌ Gagal terhubung ke database:", err);
  }
}

// Menjalankan server
app.listen(PORT, async () => {
  logger.info(`🚀 Server berjalan di port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  await testDbConnection();

  if (process.env.NODE_ENV === 'development') {
    const endpoints = listEndpoints(app).map(e => ({ path: e.path, methods: e.methods.join(', ') }));
    console.log("\nEndpoints Terdaftar:");
    console.table(endpoints);
  }
});

export default app;