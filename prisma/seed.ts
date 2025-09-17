import 'dotenv/config';

import { PrismaClient } from '@prisma/client';
import { generateHashedPassword } from '@/lib/db/utils';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_USER_EMAIL ?? 'seed@example.com';
  const password = process.env.SEED_USER_PASSWORD ?? 'password123';
  const hashedPassword = generateHashedPassword(password);

  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hashedPassword, userType: 'REGULAR' },
    create: {
      email,
      password: hashedPassword,
      userType: 'REGULAR',
    },
  });

  const chat = await prisma.chat.upsert({
    where: { id: 'seed-chat' },
    update: {},
    create: {
      id: 'seed-chat',
      title: 'Welcome to Supabase + Prisma',
      userId: user.id,
      visibility: 'PRIVATE',
    },
  });

  await prisma.message.upsert({
    where: { id: 'seed-message' },
    update: {},
    create: {
      id: 'seed-message',
      chatId: chat.id,
      role: 'assistant',
      parts: [
        {
          type: 'text',
          text: 'Your stack is now backed by Supabase, Prisma, and NextAuth. 🎉',
        },
      ],
      attachments: [],
    },
  });

  console.log('Seed data ready for user', email);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
