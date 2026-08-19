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
function migrationUrl(): string {
  const direct = process.env["DIRECT_URL"]?.trim();
  if (direct) return direct;

  const pooled = process.env["DATABASE_URL"]?.trim();
  if (!pooled) {
    // A mensagem do Prisma para url ausente não diz qual variável falta, e o
    // build quebra longe daqui — na Vercel, isso vira só "exited with 1".
    throw new Error(
      "DATABASE_URL não está definida.\n" +
        "  Local: preencha o .env (veja .env.example).\n" +
        "  Vercel: Settings > Environment Variables, marcando o ambiente deste\n" +
        "  deploy (Production e Preview), e depois refaça o deploy — variável\n" +
        "  nova não dispara build sozinha.",
    );
  }

  return pooled.replace("-pooler.", ".");
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
