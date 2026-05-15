import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma';
import { PrismaNeon } from '@prisma/adapter-neon';

const adapter = new PrismaNeon({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

const SEED_USERS = [
  {
    name: 'Super Admin',
    email: 'super_admin@example.com',
    password: '@Password123',
    role: 'super_admin',
  },
];

async function main() {
  console.log('Seeding users...');

  for (const u of SEED_USERS) {
    const hashed = await bcrypt.hash(u.password, 10);

    await prisma.user.upsert({
      where: { email: u.email },
      update: { password: hashed, emailVerified: new Date() },
      create: {
        name: u.name,
        email: u.email,
        password: hashed,
        role: u.role,
        emailVerified: new Date(),
      },
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
