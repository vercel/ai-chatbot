import { PrismaClient } from "@prisma/client";

const globalforprisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalforprisma.prisma ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") globalforprisma.prisma = prisma;
