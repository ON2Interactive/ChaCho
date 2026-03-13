import { PrismaClient } from "@prisma/client";

declare global {
  // Keep a single Prisma client during local hot reloads.
  // eslint-disable-next-line no-var
  var __chachoPrisma__: PrismaClient | undefined;
}

export const prisma =
  globalThis.__chachoPrisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__chachoPrisma__ = prisma;
}

