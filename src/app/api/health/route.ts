import { NextResponse } from "next/server";

import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";

/**
 * Diagnóstico de ambiente. Responde se as variáveis existem e se o banco
 * responde — nunca *qual* é o valor delas. Serve para distinguir "variável não
 * chegou no deploy" de "variável chegou mas o banco recusa a conexão", que da
 * fora produzem o mesmo 500 genérico.
 */
export async function GET() {
  const databaseUrl = Boolean(process.env.DATABASE_URL?.trim());
  const authSecret = process.env.AUTH_SECRET?.trim();

  let database: "ok" | "falhou" | "sem variável" = "sem variável";
  let detalhe: string | null = null;

  if (databaseUrl) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      database = "ok";
    } catch (error) {
      database = "falhou";
      // Nome e código do erro bastam para diagnosticar; a mensagem completa
      // pode carregar host e usuário, então fica de fora.
      const code = (error as { code?: string }).code;
      detalhe = error instanceof Error ? `${error.name}${code ? ` (${code})` : ""}` : "erro desconhecido";
    }
  }

  const ok = database === "ok" && Boolean(authSecret) && authSecret!.length >= 32;

  return NextResponse.json(
    {
      ok,
      variáveis: {
        DATABASE_URL: databaseUrl ? "definida" : "AUSENTE",
        AUTH_SECRET: !authSecret
          ? "AUSENTE"
          : authSecret.length < 32
            ? `curta demais (${authSecret.length} de 32 caracteres)`
            : "definida",
        APP_TIMEZONE: process.env.APP_TIMEZONE?.trim() || "não definida (usando o padrão)",
      },
      banco: database,
      detalhe,
      região: process.env.VERCEL_REGION ?? "local",
    },
    { status: ok ? 200 : 503 },
  );
}
