import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@/lib/generated/prisma/client/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

/**
 * Server-only Prisma singleton (PostgreSQL). Uses the pg driver adapter
 * (Prisma 7 style). Connection URL comes from DATABASE_URL in prisma.config.ts.
 */

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const db: PrismaClient = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}