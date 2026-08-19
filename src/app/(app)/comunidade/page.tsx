import { redirect } from "next/navigation";

import { FeedList } from "@/components/FeedList";
import { GroupBrowser } from "@/components/GroupBrowser";
import { getCurrentUser } from "@/server/auth/current-user";
import { listCategories, listGroups } from "@/server/services/community";
import { listFeed } from "@/server/services/feed";

export const metadata = { title: "Comunidade · Brotar" };
export const dynamic = "force-dynamic";

export default async function ComunidadePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sair");

  const [groups, categories, feed] = await Promise.all([
    listGroups(user.id),
    listCategories(),
    listFeed(user.id),
  ]);

  return (
    <section className="view">
      <header className="hero" style={{ paddingTop: 36 }}>
        <div className="hero-eyebrow">Comunidade</div>
        <h1 style={{ fontSize: 28 }}>Gente recomeçando junto com você</h1>
        <p>Grupos por interesse e um mural de conquistas de quem está no mesmo caminho.</p>
      </header>

      <div style={{ marginTop: 24 }}>
        <GroupBrowser groups={groups} categories={categories} />
      </div>

      <div className="section-head" style={{ marginTop: 8 }}>
        <h2>Mural de conquistas</h2>
      </div>

      <FeedList items={feed} />
    </section>
  );
}
