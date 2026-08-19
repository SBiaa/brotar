import { redirect } from "next/navigation";

import { StatChips } from "@/components/StatChips";
import { getCurrentUser } from "@/server/auth/current-user";
import { getProfile } from "@/server/services/profile";

export const metadata = { title: "Perfil · Brotar" };
export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sair");

  const profile = await getProfile(user.id);
  const unlocked = profile.badges.filter((b) => b.unlocked).length;

  return (
    <section className="view">
      <header className="hero" style={{ paddingTop: 36 }}>
        <div className="hero-eyebrow">Perfil</div>
        <h1 style={{ fontSize: 28 }}>Sua jornada até aqui</h1>
      </header>

      <div className="profile-card" style={{ marginTop: 22 }}>
        <div className="profile-avatar">{profile.initials}</div>
        <div>
          <h3>{profile.name}</h3>
          <p>
            Cultivando desde {profile.memberSince} · {profile.activeHabits}{" "}
            {profile.activeHabits === 1 ? "hábito ativo" : "hábitos ativos"}
          </p>
        </div>
      </div>

      <StatChips
        items={[
          { value: profile.stats.longestStreak, label: "maior sequência" },
          { value: profile.stats.activeHabits, label: "hábitos ativos" },
          { value: profile.stats.daysOnBrotar, label: "dias no Brotar" },
          { value: profile.stats.groups, label: "grupos" },
        ]}
      />

      <div className="section-head">
        <h2>Conquistas</h2>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-soft)" }}>
          {unlocked}/{profile.badges.length}
        </span>
      </div>

      <div className="badge-grid">
        {profile.badges.map((badge) => (
          <div className={`badge ${badge.unlocked ? "" : "locked"}`} key={badge.key}>
            <div className="icon">{badge.icon}</div>
            <div className="name">{badge.name}</div>
            <div className="desc">{badge.description}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
