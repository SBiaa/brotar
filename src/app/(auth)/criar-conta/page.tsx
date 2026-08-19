import { Suspense } from "react";

import { AuthForm } from "@/components/AuthForm";

export const metadata = { title: "Criar conta · Brotar" };

export default function CriarContaPage() {
  return (
    <Suspense>
      <AuthForm mode="criar-conta" />
    </Suspense>
  );
}
