import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/auth'; // pastikan path sesuai struktur project kamu

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Start seeding...');

  const password = await hashPassword('Kl@ten123'); // password yang akan di-hash

  await prisma.user.upsert({
    where: { email: 'admin@arsana.com' },
    update: {},
    create: {
      email: 'admin@arsana.com',
      password: password, // simpan hasil hash
      name: 'Administrator1',
      role: 'ADMIN'
    }
  });

  console.log('✅ Seeding finished!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
