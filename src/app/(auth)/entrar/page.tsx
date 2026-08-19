import { Suspense } from "react";

import { AuthForm } from "@/components/AuthForm";

export const metadata = { title: "Entrar · Brotar" };

export default function EntrarPage() {
  return (
    <Suspense>
      <AuthForm mode="entrar" />
    </Suspense>
  );
}
