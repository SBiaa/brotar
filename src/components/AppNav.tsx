"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "@/lib/api";

import { Logo } from "./Logo";

const TABS = [
  { href: "/hoje", label: "Hoje" },
  { href: "/habitos", label: "Hábitos" },
  { href: "/comunidade", label: "Comunidade" },
  { href: "/perfil", label: "Perfil" },
];

export function AppNav({ userName }: { userName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  async function handleLogout() {
    setLeaving(true);
    try {
      await api.post("/auth/logout");
      router.replace("/entrar");
      router.refresh();
    } finally {
      setLeaving(false);
    }
  }

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/hoje" aria-label="Brotar, ir para Hoje">
          <Logo />
        </Link>

        <div className="tabs">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`tab-btn ${pathname === tab.href ? "active" : ""}`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <div className="nav-user">
          <span>{userName.split(" ")[0]}</span>
          <button type="button" onClick={handleLogout} disabled={leaving}>
            {leaving ? "Saindo…" : "Sair"}
          </button>
        </div>
      </div>
    </nav>
  );
}
