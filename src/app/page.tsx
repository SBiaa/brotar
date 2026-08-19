import { redirect } from "next/navigation";

import { getSession } from "@/server/auth/session";

// O middleware normalmente já resolve "/", mas manter o redirect aqui evita
// uma rota morta se o matcher mudar.
export default async function RootPage() {
  const session = await getSession();
  redirect(session ? "/hoje" : "/entrar");
}
