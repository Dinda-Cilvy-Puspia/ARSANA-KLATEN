import cron from 'node-cron';
import { PrismaClient, IncomingLetter, OutgoingLetter } from '@prisma/client';
import nodemailer from 'nodemailer';
import logger from '../utils/logger';

const prisma = new PrismaClient();

// PEMBARUAN: Buat satu instance transporter untuk digunakan kembali
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// PEMBARUAN: Mekanisme kunci untuk mencegah job tumpang tindih
const jobStatus = {
  upcomingEvents: false,
  overdueInvitations: false,
  weeklySummary: false,
};

// =====================================
// Fungsi Helper Notifikasi
// =====================================

const createNotification = async (title: string, message: string, type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR' = 'INFO', userId?: string) => {
  return prisma.notification.create({
    data: { title, message, type, userId }
  });
};

const sendEmailNotification = async (to: string, subject: string, text: string, html?: string) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.warn('SMTP credentials not configured, skipping email notification.');
    return;
  }
  try {
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'ARSANA System'}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html
    });
    logger.info(`Email sent successfully to ${to}`);
  } catch (error) {
    logger.error('Failed to send email:', error);
  }
};

// PEMBARUAN: Helper untuk memproses pengingat acara (Prinsip DRY)
type LetterWithUser = (IncomingLetter | OutgoingLetter) & { user: { email: string; name: string; } };

const processEventReminders = async (letters: LetterWithUser[], type: 'Incoming' | 'Outgoing') => {
  for (const letter of letters) {
    const title = 'Pengingat Acara Besok';
    const message = `Acara "${letter.subject}" dijadwalkan untuk besok di lokasi: ${letter.eventLocation || 'Belum ditentukan'}`;
    
    // Buat notifikasi global di sistem
    await createNotification(title, message, 'INFO');
    
    // Kirim email ke pembuat surat
    if (letter.user?.email) {
      await sendEmailNotification(
        letter.user.email,
        title,
        message,
        `<p><strong>${title}</strong></p><p>${message}</p><p><strong>Acara:</strong> ${letter.subject}</p><p><strong>Tanggal:</strong> ${letter.eventDate?.toLocaleDateString('id-ID', { dateStyle: 'full' })}</p><p><strong>Lokasi:</strong> ${letter.eventLocation || 'Belum ditentukan'}</p>`
      );
    }
  }
};


// =====================================
// Logika Inti Cron Job
// =====================================

/**
 * Memeriksa acara mendatang (H-1) dan mengirimkan notifikasi.
 */
const checkUpcomingEvents = async () => {
  if (jobStatus.upcomingEvents) {
    logger.warn('Upcoming events job is already running. Skipping.');
    return;
  }
  jobStatus.upcomingEvents = true;
  logger.info('Running upcoming events check...');

  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    const whereClause = {
      isInvitation: true,
      eventDate: { gte: tomorrow, lt: dayAfterTomorrow }
    };
    const includeUser = { user: { select: { email: true, name: true } } };

    const upcomingIncoming = await prisma.incomingLetter.findMany({ where: whereClause, include: includeUser });
    const upcomingOutgoing = await prisma.outgoingLetter.findMany({ where: whereClause, include: includeUser });

    await processEventReminders(upcomingIncoming, 'Incoming');
    await processEventReminders(upcomingOutgoing, 'Outgoing');

    logger.info(`Processed ${upcomingIncoming.length + upcomingOutgoing.length} event reminders.`);
  } catch (error) {
    logger.error('Error checking upcoming events:', error);
    await createNotification('System Error', 'Gagal memeriksa acara mendatang.', 'ERROR');
  } finally {
    jobStatus.upcomingEvents = false;
  }
};

/**
 * Memeriksa undangan yang sudah lewat waktu dan mengirim notifikasi (hanya sekali).
 */
const checkOverdueInvitations = async () => {
  if (jobStatus.overdueInvitations) {
    logger.warn('Overdue invitations job is already running. Skipping.');
    return;
  }
  jobStatus.overdueInvitations = true;
  logger.info('Running overdue invitations check...');
  
  try {
    const now = new Date();
    
    // PEMBARUAN: Hanya ambil undangan yang belum pernah dinotifikasi
    const whereClause = {
      isInvitation: true,
      eventDate: { lt: now },
      overdueNotifiedAt: null // Cek field baru
    };
    
    const overdueLetters = await prisma.incomingLetter.findMany({ where: whereClause, take: 20 });
    
    if (overdueLetters.length > 0) {
      const idsToUpdate = overdueLetters.map(letter => letter.id);
      
      // Buat notifikasi
      await createNotification(
        'Undangan Terlewat',
        `${overdueLetters.length} undangan acara telah melewati batas waktu dan mungkin memerlukan arsip atau tindak lanjut.`,
        'WARNING'
      );
      
      // PEMBARUAN: Tandai bahwa notifikasi sudah dikirim
      await prisma.incomingLetter.updateMany({
        where: { id: { in: idsToUpdate } },
        data: { overdueNotifiedAt: new Date() }
      });

      logger.info(`Processed ${overdueLetters.length} overdue invitations.`);
    } else {
        logger.info('No new overdue invitations found.');
    }
  } catch (error) {
    logger.error('Error checking overdue invitations:', error);
  } finally {
    jobStatus.overdueInvitations = false;
  }
};

/**
 * Membuat rangkuman mingguan.
 */
const generateWeeklySummary = async () => {
    if (jobStatus.weeklySummary) {
        logger.warn('Weekly summary job is already running. Skipping.');
        return;
    }
    jobStatus.weeklySummary = true;
    logger.info('Generating weekly summary...');

    try {
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1));
        const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 7));

        const [incomingCount, outgoingCount] = await prisma.$transaction([
            prisma.incomingLetter.count({ where: { createdAt: { gte: startOfWeek, lte: endOfWeek } } }),
            prisma.outgoingLetter.count({ where: { createdAt: { gte: startOfWeek, lte: endOfWeek } } })
        ]);

        await createNotification(
            'Rangkuman Mingguan',
            `Minggu ini diproses: ${incomingCount} surat masuk dan ${outgoingCount} surat keluar.`,
            'INFO'
        );
        logger.info(`Weekly summary generated: ${incomingCount} incoming, ${outgoingCount} outgoing.`);
    } catch (error) {
        logger.error('Error generating weekly summary:', error);
    } finally {
        jobStatus.weeklySummary = false;
    }
};


// =====================================
// Inisialisasi Semua Cron Job
// =====================================

export const startCronJobs = () => {
  logger.info('Initializing cron jobs...');

  // PEMBARUAN: Jadwal didefinisikan sebagai konstanta
  const SCHEDULES = {
    UPCOMING_EVENTS: '0 9 * * *',      // Setiap hari jam 9 pagi
    OVERDUE_INVITATIONS: '0 18 * * *', // Setiap hari jam 6 sore
    WEEKLY_SUMMARY: '0 8 * * 1',       // Setiap Senin jam 8 pagi
  };
  
  cron.schedule(SCHEDULES.UPCOMING_EVENTS, checkUpcomingEvents, { timezone: "Asia/Jakarta" });
  cron.schedule(SCHEDULES.OVERDUE_INVITATIONS, checkOverdueInvitations, { timezone: "Asia/Jakarta" });
  cron.schedule(SCHEDULES.WEEKLY_SUMMARY, generateWeeklySummary, { timezone: "Asia/Jakarta" });

  logger.info('Cron jobs started successfully.');
};