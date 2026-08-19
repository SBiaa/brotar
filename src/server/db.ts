import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

// O dev server do Next recarrega os módulos a cada edição; sem o cache no
// globalThis cada reload abriria uma nova conexão com o banco.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createClient(): PrismaClient {
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

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}

/**
 * O cliente só nasce no primeiro acesso, não quando o módulo é importado.
 *
 * `next build` importa cada rota para coletar metadados, e um cliente criado no
 * escopo do módulo tentaria falar com o banco durante o build — o que quebra a
 * build inteira num ambiente que só tem as credenciais em tempo de execução.
 * O proxy mantém a ergonomia de `prisma.user.findMany()` sem esse custo.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const value = Reflect.get(getClient(), property, receiver);
    return typeof value === "function" ? value.bind(getClient()) : value;
  },
}) as PrismaClient;
