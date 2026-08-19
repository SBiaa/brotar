"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { ApiRequestError, api } from "@/lib/api";

import { Logo } from "./Logo";

type Mode = "entrar" | "criar-conta";

const COPY = {
  entrar: {
    title: "Que bom te ver de novo",
    subtitle: "Seu jardim continua exatamente onde você parou.",
    submit: "Entrar",
    altText: "Ainda não tem conta?",
    altLink: "/criar-conta",
    altLabel: "Criar conta",
  },
  "criar-conta": {
    title: "Comece de onde você está",
    subtitle: "Sem meta impossível: um hábito, um dia de cada vez.",
    submit: "Criar conta",
    altText: "Já tem conta?",
    altLink: "/entrar",
    altLabel: "Entrar",
  },
} as const;

export function AuthForm({ mode }: { mode: Mode }) {
  const copy = COPY[mode];
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const data = new FormData(event.currentTarget);
    const payload = Object.fromEntries(data.entries());

    try {
      await api.post(`/auth/${mode === "entrar" ? "login" : "register"}`, payload);
      const next = searchParams.get("proximo") ?? "/hoje";
      startTransition(() => {
        router.replace(next);
        router.refresh();
      });
    } catch (cause) {
      setError(
        cause instanceof ApiRequestError ? cause.message : "Não foi possível concluir agora",
      );
      setSubmitting(false);
    }
  }

  const busy = submitting || isPending;

  return (
    <main className="auth-shell">
      <form className="auth-card" onSubmit={handleSubmit}>
        <Logo />
        <h1>{copy.title}</h1>
        <p className="sub">{copy.subtitle}</p>

        {error ? (
          <div className="auth-error" role="alert">
            {error}
          </div>
        ) : null}

        {mode === "criar-conta" ? (
          <div className="field">
            <label htmlFor="name">Como podemos te chamar</label>
            <input id="name" name="name" type="text" autoComplete="name" required minLength={2} />
          </div>
        ) : null}

        <div className="field">
          <label htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
        </div>

        <div className="field">
          <label htmlFor="password">Senha</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "entrar" ? "current-password" : "new-password"}
            required
            minLength={mode === "criar-conta" ? 8 : undefined}
          />
        </div>

        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? "Um instante…" : copy.submit}
        </button>

        <p className="auth-alt">
          {copy.altText} <Link href={copy.altLink}>{copy.altLabel}</Link>
        </p>
      </form>
    </main>
  );
}
