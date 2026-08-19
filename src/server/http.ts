import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { NotFoundError, UnauthorizedError, ValidationError } from "./errors";

/**
 * Traduz erro de domínio em resposta HTTP. É o único lugar que sabe de status —
 * os serviços só lançam erros, sem depender de Next nem de HTTP.
 */
export function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }

  if (
    error instanceof ValidationError ||
    error instanceof UnauthorizedError ||
    error instanceof NotFoundError
  ) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error("[brotar] erro não tratado:", error);
  return NextResponse.json({ error: "Algo deu errado do nosso lado" }, { status: 500 });
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ValidationError("Corpo da requisição inválido");
  }
}
