import { SignJWT, jwtVerify } from "jose";

/**
 * Assinatura/verificação do token de sessão.
 * Fica separado de `session.ts` porque o middleware roda no edge runtime e
 * não pode importar `next/headers` nem o Prisma.
 */

export const SESSION_COOKIE = "brotar_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
};

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error(
      "AUTH_SECRET ausente ou curta demais (mínimo 32 caracteres). Veja .env.example",
    );
  }
  return new TextEncoder().encode(value);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ email: payload.email, name: payload.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.sub !== "string") return null;
    return {
      userId: payload.sub,
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
    };
  } catch {
    return null;
  }
}
