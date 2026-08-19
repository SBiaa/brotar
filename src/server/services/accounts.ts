import { z } from "zod";

import type { SessionPayload } from "../auth/jwt";
import { hashPassword, verifyPassword } from "../auth/password";
import { prisma } from "../db";
import { ValidationError } from "../errors";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Diga como podemos te chamar").max(60),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z.string().min(8, "A senha precisa de pelo menos 8 caracteres").max(200),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});

export async function register(input: unknown): Promise<SessionPayload> {
  const { name, email, password } = registerSchema.parse(input);

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw new ValidationError("Já existe uma conta com esse e-mail");

  const user = await prisma.user.create({
    data: { name, email, passwordHash: await hashPassword(password) },
    select: { id: true, name: true, email: true },
  });

  return { userId: user.id, name: user.name, email: user.email };
}

export async function login(input: unknown): Promise<SessionPayload> {
  const { email, password } = loginSchema.parse(input);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, passwordHash: true },
  });

  // Mensagem única de propósito: não revela se o e-mail existe.
  const invalid = new ValidationError("E-mail ou senha incorretos");
  if (!user) {
    // Gasta o mesmo tempo de um bcrypt real para não vazar a diferença no relógio.
    await verifyPassword(password, "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva");
    throw invalid;
  }

  if (!(await verifyPassword(password, user.passwordHash))) throw invalid;

  return { userId: user.id, name: user.name, email: user.email };
}
