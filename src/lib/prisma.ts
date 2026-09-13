// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma_session_v1: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma_session_v1 ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma_session_v1 = prisma;
}

export default prisma;
// Forced reload for UserSession tracking at Sat May 16 19:10:00 IST 2026
