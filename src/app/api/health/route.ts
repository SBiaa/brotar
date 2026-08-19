import { NextResponse } from "next/server";

import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";

/**
 * A mensagem de erro do driver pode citar a string de conexão, o host ou o
 * usuário. Como esta rota é pública, isso sai antes de virar resposta.
 */
function redact(message: string): string {
  return message
    .replace(/postgres(?:ql)?:\/\/\S+/gi, "[conexão]")
    .replace(/[\w.-]+\.neon\.tech/gi, "[host]")
    .replace(/\b[\w.-]+@[\w.-]+\b/g, "[credencial]")
    .slice(0, 400);
}

/**
 * Descreve a *forma* da string de conexão sem publicar seu conteúdo: o
 * suficiente para reconhecer um valor truncado ou colado pela metade, que é a
 * falha mais comum ao configurar isso à mão num painel.
 */
function describeUrl(value: string) {
  try {
    const url = new URL(value);
    return {
      protocolo: url.protocol.replace(":", ""),
      hostÉNeon: url.hostname.endsWith(".neon.tech"),
      hostTerminaEm: url.hostname.slice(-14),
      viaPooler: url.hostname.includes("-pooler"),
      temUsuário: Boolean(url.username),
      temSenha: Boolean(url.password),
      banco: url.pathname.replace("/", "") || "(nenhum)",
      sslmode: url.searchParams.get("sslmode") ?? "(não informado)",
    };
  } catch {
    return { erro: "não é uma URL válida — provavelmente truncada ou com espaço no meio" };
  }
}

/**
 * Diagnóstico de ambiente. Responde se as variáveis existem e se o banco
 * responde — nunca *qual* é o valor delas. Serve para distinguir "variável não
 * chegou no deploy" de "variável chegou mas o banco recusa a conexão", que da
 * fora produzem o mesmo 500 genérico.
 */
export async function GET() {
  const rawUrl = process.env.DATABASE_URL?.trim();
  const databaseUrl = Boolean(rawUrl);
  const authSecret = process.env.AUTH_SECRET?.trim();

  let database: "ok" | "falhou" | "sem variável" = "sem variável";
  let detalhe: string | null = null;

  if (databaseUrl) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      database = "ok";
    } catch (error) {
      database = "falhou";
      const code = (error as { code?: string }).code;
      const message = error instanceof Error ? redact(error.message) : "erro desconhecido";
      detalhe = `${code ? `${code}: ` : ""}${message}`;
    }
  }

  const ok = database === "ok" && Boolean(authSecret) && authSecret!.length >= 32;
  const conexão = rawUrl ? describeUrl(rawUrl) : null;

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
      conexão,
      região: process.env.VERCEL_REGION ?? "local",
    },
    { status: ok ? 200 : 503 },
  );
}
