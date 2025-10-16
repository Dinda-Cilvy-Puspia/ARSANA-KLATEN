import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';


import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import incomingLetterRoutes from './routes/incomingLetter.routes';
import outgoingLetterRoutes from './routes/outgoingLetter.routes';
import dispositionRoutes from './routes/disposition.routes';
import notificationRoutes from './routes/notification.routes';
import calendarRoutes from './routes/calendar.routes';
import fileRoutes from './routes/file.routes';


import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { requestLogger, detailedRequestLogger } from './middleware/requestLogger';


import { startCronJobs } from './services/cronService';


import logger, { devLogger } from './utils/logger';

const app: Express = express();
const prisma = new PrismaClient();


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


const loggerMiddlewares = requestLogger();
loggerMiddlewares.forEach(middleware => app.use(middleware));


app.use(detailedRequestLogger);


app.use(helmet());


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
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


const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['http://localhost:3000'] // domain frontend produksi
    : ['http://localhost:3000'],
  credentials: true,
  exposedHeaders: ['Content-Disposition'], 
};

app.use(cors(corsOptions));


app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf, encoding) => {
    if (process.env.NODE_ENV === 'development' && buf.length > 1024 * 1024) {
      devLogger.warn(`Large JSON payload: ${Math.round(buf.length / 1024)}KB`);
    }
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  verify: (req, res, buf, encoding) => {
    if (process.env.NODE_ENV === 'development' && buf.length > 1024 * 1024) {
      devLogger.warn(`Large form payload: ${Math.round(buf.length / 1024)}KB`);
    }
  }
}));


app.use('/uploads', (req, res, next) => {
  devLogger.debug(`Static file request: ${req.path}`);
  next();
}, express.static(path.join(__dirname, '..', 'uploads')));


app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/incoming-letters', incomingLetterRoutes);
app.use('/api/outgoing-letters', outgoingLetterRoutes);
app.use('/api/dispositions', dispositionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/files', fileRoutes);


app.get('/api/health', (req, res) => {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version
  };
  
  devLogger.info('Health check requested', healthData);
  res.json(healthData);
});


app.use(notFoundHandler);
app.use(errorHandler);


startCronJobs();
logger.info('Cron jobs started');


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

const listEndpoints = require('express-list-endpoints');
console.table(listEndpoints(app));

async function testConnection() {
  try {
    const result = await prisma.$queryRaw`SELECT NOW()`;
    console.log("✅ Connected to Supabase:", result);
  } catch (err) {
    console.error("❌ Connection failed:", err);
  }
}

testConnection();

app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📝 Logging level: ${process.env.NODE_ENV === 'production' ? 'info' : 'debug'}`);
  
  if (process.env.NODE_ENV === 'development') {
    devLogger.info('Development logging enabled');
    devLogger.info('File logging:', process.env.ENABLE_FILE_LOGGING === 'true' ? 'enabled' : 'disabled');
    devLogger.info('Detailed request logging:', process.env.DETAILED_REQUEST_LOGGING === 'true' ? 'enabled' : 'disabled');
  }
});

console.log('Server timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('Server local time:', new Date().toString());
console.log('Server UTC time:', new Date().toUTCString());

export default app;