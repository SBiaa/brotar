import { redirect } from "next/navigation";

import { HabitList } from "@/components/HabitList";
import { NewHabitPanel } from "@/components/NewHabitPanel";
import { getCurrentUser } from "@/server/auth/current-user";
import { todayIso } from "@/server/dates";
import { listHabits } from "@/server/services/habits";

export const metadata = { title: "Hábitos · Brotar" };
export const dynamic = "force-dynamic";

export default async function HabitosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sair");

  const today = todayIso();
  const habits = await listHabits(user.id, today);

  return (
    <section className="view">
      <header className="hero" style={{ paddingTop: 36 }}>
        <div className="hero-eyebrow">Seus hábitos</div>
        <h1 style={{ fontSize: 28 }}>Tudo que você está cultivando</h1>
      </header>

      <NewHabitPanel />

      <HabitList
        habits={habits}
        today={today}
        allowArchive
        emptyMessage={
          <>
            Sua horta está vazia por enquanto.
            <br />
            Comece com um hábito só — dá para plantar os outros depois.
          </>
        }
      />
    </section>
  );
}
