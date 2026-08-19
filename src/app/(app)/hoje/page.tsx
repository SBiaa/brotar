import Link from "next/link";
import { redirect } from "next/navigation";

import { Garden } from "@/components/Garden";
import { HabitList } from "@/components/HabitList";
import { StatChips } from "@/components/StatChips";
import { getCurrentUser } from "@/server/auth/current-user";
import { getDashboard } from "@/server/services/dashboard";

export const metadata = { title: "Hoje · Brotar" };
export const dynamic = "force-dynamic";

export default async function HojePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sair");

  const dashboard = await getDashboard(user.id, user.name);

  return (
    <section className="view">
      <header className="hero">
        <div className="hero-eyebrow">{dashboard.dateLabel}</div>
        <h1>{dashboard.greeting}</h1>
        <p>
          Cada dia preenchido no seu jardim é um passo — não precisa ser perfeito, precisa ser
          contínuo.
        </p>
      </header>

      <Garden days={dashboard.garden} />

      <StatChips
        items={[
          { value: dashboard.stats.longestActiveStreak, label: "maior sequência ativa" },
          { value: `${dashboard.stats.avgConsistency30}%`, label: "consistência média (30d)" },
          { value: dashboard.stats.activeHabits, label: "hábitos ativos" },
        ]}
      />

      <div className="section-head">
        <h2>Hábitos de hoje</h2>
      </div>

      <HabitList
        habits={dashboard.habits}
        today={dashboard.today}
        emptyMessage={
          <>
            Nada plantado ainda.{" "}
            <Link href="/habitos" style={{ color: "var(--moss-dark)", fontWeight: 600 }}>
              Crie seu primeiro hábito
            </Link>{" "}
            — comece com algo pequeno o bastante para caber num dia ruim.
          </>
        }
      />
    </section>
  );
}
