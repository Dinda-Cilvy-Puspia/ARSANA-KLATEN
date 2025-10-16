import express, { Express } from 'express';
// PERBAIKAN: Impor CorsOptions untuk digunakan sebagai tipe
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

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  devLogger.info('Created logs directory');
}

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  devLogger.info('Created uploads directory');
}

// Middleware Logging
const loggerMiddlewares = requestLogger();
loggerMiddlewares.forEach(middleware => app.use(middleware));
app.use(detailedRequestLogger);

// Middleware Keamanan
app.use(helmet());

// Middleware Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      url: req.originalUrl
    });
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});
app.use(limiter);

// Konfigurasi CORS yang Fleksibel
const allowedOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : ['http://localhost:3000'];

// PERBAIKAN: Menambahkan tipe eksplisit untuk parameter 'origin' dan 'callback'
const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Izinkan request tanpa origin (seperti dari Postman) atau jika origin ada di daftar yang diizinkan
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  exposedHeaders: ['Content-Disposition'],
};

app.use(cors(corsOptions));

// Middleware Body Parser
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    if (process.env.NODE_ENV === 'development' && buf.length > 1024 * 1024) {
      devLogger.warn(`Large JSON payload: ${Math.round(buf.length / 1024)}KB`);
    }
  }
}));
app.use(express.urlencoded({
  extended: true,
  limit: '10mb',
  verify: (req, res, buf) => {
    if (process.env.NODE_ENV === 'development' && buf.length > 1024 * 1024) {
      devLogger.warn(`Large form payload: ${Math.round(buf.length / 1024)}KB`);
    }
  }
}));

// Middleware untuk menyajikan file statis
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Definisi Rute API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/incoming-letters', incomingLetterRoutes);
app.use('/api/outgoing-letters', outgoingLetterRoutes);
app.use('/api/dispositions', dispositionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/files', fileRoutes);

// Rute Health Check
app.get('/api/health', (req, res) => {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
  devLogger.info('Health check requested');
  res.json(healthData);
});

// Middleware Penanganan Error
app.use(notFoundHandler);
app.use(errorHandler);

// Memulai Cron Jobs
startCronJobs();
logger.info('Cron jobs started');

// Fungsi Graceful Shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully...`);
  try {
    await prisma.$disconnect();
    logger.info('Database connection closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

const PORT = process.env.PORT || 5000;

// Fungsi Tes Koneksi Database
async function testConnection() {
  try {
    await prisma.$queryRaw`SELECT NOW()`;
    logger.info("✅ Database connection successful.");
  } catch (err) {
    logger.error("❌ Database connection failed:", err);
  }
}

// Menjalankan server
app.listen(PORT, async () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  await testConnection();

  // Hanya tampilkan daftar endpoint di mode development
  if (process.env.NODE_ENV === 'development') {
    console.log("Registered Endpoints:");
    console.table(listEndpoints(app));
    devLogger.info('Development logging enabled');
  }
});

export default app;