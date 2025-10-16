import { PrismaClient, Role, LetterNature, DispositionMethod } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { hashPassword } from '../src/utils/auth'; 

const prisma = new PrismaClient();

function parseDate(dateString: string): Date | null {
  if (!dateString || dateString.trim() === '') return null;
  const parts = dateString.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (parts) {
    return new Date(parseInt(parts[3]), parseInt(parts[2]) - 1, parseInt(parts[1]));
  }
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

async function main() {
  console.log('🚀 Starting the seeding process...');

  // 1. Seed Users
  console.log('🌱 Seeding Users...');
  const usersPath = path.join(__dirname, 'data', 'users.csv');
  
  // PERBAIKAN: Menghapus opsi separator agar kembali menggunakan koma (,) sebagai default
  const usersStream = fs.createReadStream(usersPath).pipe(csv());

  for await (const row of usersStream) {
    if (!row.name || !row.email || !row.password) {
        console.warn('⏩ Skipping invalid row in users.csv:', row);
        continue;
    }
      
    const hashedPassword = await hashPassword(row.password);

    await prisma.user.upsert({
      where: { email: row.email },
      update: {
        password: hashedPassword,
        name: row.name,
      },
      create: {
        name: row.name,
        email: row.email,
        password: hashedPassword,
        role: row.role === 'ADMIN' ? Role.ADMIN : Role.STAFF,
      },
    });
  }
  console.log('✅ Users seeded successfully.');

  const defaultUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!defaultUser) {
    console.error('❌ Could not find an ADMIN user to assign letters to. Please create one first.');
    return;
  }
  console.log(`✉️  All letters will be assigned to: ${defaultUser.name}`);

  // 2. Seed Incoming Letters
  console.log('🌱 Seeding Incoming Letters...');
  const lettersPath = path.join(__dirname, 'data', 'incoming_letters.csv');
  
  // PERBAIKAN: Menghapus opsi separator agar kembali menggunakan koma (,) sebagai default
  const lettersStream = fs.createReadStream(lettersPath).pipe(csv());
  
  let createdCount = 0;

  for await (const row of lettersStream) {
    if (!row.letterNumber) {
        console.warn('⏩ Skipping invalid row in incoming_letters.csv:', row);
        continue;
    }

    const existingLetter = await prisma.incomingLetter.findUnique({
      where: { letterNumber: row.letterNumber },
    });

    if (existingLetter) {
        continue;
    }

    await prisma.incomingLetter.create({
      data: {
        letterNumber: row.letterNumber,
        subject: row.subject,
        sender: row.sender,
        recipient: row.recipient,
        processor: row.processor,
        receivedDate: parseDate(row.receivedDate) || new Date(),
        letterDate: parseDate(row.letterDate),
        note: row.note,
        isInvitation: row.isInvitation?.toUpperCase() === 'TRUE',
        eventDate: parseDate(row.eventDate),
        needsFollowUp: row.needsFollowUp?.toUpperCase() === 'TRUE',
        letterNature: Object.values(LetterNature).includes(row.letterNature?.toUpperCase()) 
          ? row.letterNature.toUpperCase() 
          : LetterNature.BIASA,
        dispositionMethod: Object.values(DispositionMethod).includes(row.dispositionMethod?.toUpperCase())
          ? row.dispositionMethod.toUpperCase()
          : DispositionMethod.MANUAL,
        dispositionTarget: 'UMPEG', 
        userId: defaultUser.id,
      },
    });
    createdCount++;
  }
  console.log(`✅ ${createdCount} new Incoming Letters seeded successfully.`);
  
  console.log('🎉 Seeding process finished.');
}

main()
  .catch((e) => {
    console.error('❌ An error occurred during the seeding process:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });