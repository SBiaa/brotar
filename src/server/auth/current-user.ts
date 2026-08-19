import { prisma } from "../db";
import { UnauthorizedError } from "../errors";
import { getSession } from "./session";

export type CurrentUser = { id: string; name: string; email: string };

/**
 * O cookie prova quem a pessoa é, mas não prova que a conta ainda existe —
 * um banco resetado deixa tokens válidos apontando para o vazio. Toda escrita
 * depende dessa checagem para não estourar em erro de chave estrangeira.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();
  if (!session) return null;

  return prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true },
  });
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}
