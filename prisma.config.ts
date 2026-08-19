import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Conexão usada pela CLI do Prisma (migrações e seed).
 *
 * O app fala com o Neon pelo pooler, mas o pooler é PgBouncer em modo
 * transaction: ele não mantém a sessão que a aplicação de DDL precisa. Migrar
 * exige a conexão direta, que no Neon é o mesmo host sem o sufixo "-pooler".
 * Se DIRECT_URL não estiver preenchida, derivamos dela em vez de falhar.
 */
function migrationUrl(): string | undefined {
  const direct = process.env["DIRECT_URL"]?.trim();
  if (direct) return direct;

  const pooled = process.env["DATABASE_URL"]?.trim();
  return pooled?.replace("-pooler.", ".");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: migrationUrl(),
  },
});
