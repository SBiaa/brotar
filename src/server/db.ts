import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "@/generated/prisma/client";

// O dev server do Next recarrega os módulos a cada edição; sem o cache no
// globalThis cada reload abriria uma nova conexão com o banco.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL não configurada — copie .env.example para .env");
  }

  return new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url }),
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
