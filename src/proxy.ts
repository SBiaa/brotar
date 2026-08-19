import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE, verifySession } from "@/server/auth/jwt";

const PUBLIC_ROUTES = ["/entrar", "/criar-conta"];
// /sair precisa passar mesmo com sessão válida: é ela que apaga o cookie.
const ALWAYS_ALLOWED = ["/sair"];
const HOME = "/hoje";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  const isPublic = PUBLIC_ROUTES.includes(pathname);

  if (ALWAYS_ALLOWED.includes(pathname)) return NextResponse.next();

  if (pathname === "/") {
    return NextResponse.redirect(new URL(session ? HOME : "/entrar", request.url));
  }

  if (!session && !isPublic) {
    const url = new URL("/entrar", request.url);
    // Volta para onde a pessoa queria ir depois do login.
    if (pathname !== HOME) url.searchParams.set("proximo", pathname);
    return NextResponse.redirect(url);
  }

  if (session && isPublic) {
    return NextResponse.redirect(new URL(HOME, request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Deixa de fora API, assets e arquivos estáticos — a API responde 401 sozinha.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
