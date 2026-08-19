import { NextResponse } from "next/server";

import { endSession } from "@/server/auth/session";

/**
 * Saída por navegação. Serve para o logout normal e, principalmente, para
 * sessões órfãs: se o cookie é válido mas a conta sumiu, redirecionar direto
 * para /entrar entraria em laço com o proxy, que só sabe validar o token.
 * Aqui o cookie morre antes do redirect.
 */
export async function GET(request: Request) {
  await endSession();
  return NextResponse.redirect(new URL("/entrar", request.url));
}
