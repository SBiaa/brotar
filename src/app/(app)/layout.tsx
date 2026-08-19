import { redirect } from "next/navigation";

import { AppNav } from "@/components/AppNav";
import { getCurrentUser } from "@/server/auth/current-user";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sair");

  return (
    <>
      <AppNav userName={user.name} />
      <div className="app">
        {children}
        <p className="footer-note">
          brotar · feito para quem está começando, ou começando de novo
        </p>
      </div>
    </>
  );
}
