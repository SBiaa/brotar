import { PrismaPg } from "@prisma/adapter-pg";

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

  // Aqui vai a string *pooled* do Neon (host com "-pooler"): cada request do
  // Next abre sua própria conexão, e o pooler é quem segura isso.
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: url }),
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
