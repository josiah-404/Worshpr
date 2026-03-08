import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma';
import { PrismaNeon } from '@prisma/adapter-neon';

const adapter = new PrismaNeon({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

const SEED_USERS = [
  {
    name: 'Admin User',
    email: 'admin@worshpr.com',
    password: 'admin1234',
    role: 'ADMIN' as const,
  },
  {
    name: 'Media User',
    email: 'media@worshpr.com',
    password: 'media1234',
    role: 'MEDIA' as const,
  },
];

async function main() {
  console.log('Seeding users...');

  for (const u of SEED_USERS) {
    const hashed = await bcrypt.hash(u.password, 10);

    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { name: u.name, email: u.email, password: hashed, role: u.role },
    });

    console.log(`  ✔ ${u.role}: ${u.email} / ${u.password}`);
  }

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
