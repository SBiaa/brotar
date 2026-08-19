"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { ApiRequestError, api } from "@/lib/api";
import type { GroupDto } from "@/lib/types";

export function GroupBrowser({
  groups,
  categories,
}: {
  groups: GroupDto[];
  categories: string[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(groups);
  const [filter, setFilter] = useState("Todos");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Ressincroniza com o servidor durante a renderização (ver HabitList).
  const [syncedFrom, setSyncedFrom] = useState(groups);
  if (syncedFrom !== groups) {
    setSyncedFrom(groups);
    setItems(groups);
  }

  // A lista inteira já veio do servidor: filtrar aqui evita ida e volta.
  const visible = useMemo(
    () => (filter === "Todos" ? items : items.filter((g) => g.category === filter)),
    [items, filter],
  );

  async function toggleJoin(group: GroupDto) {
    setError(null);
    setPendingId(group.id);
    try {
      const result = await api.post<{ joined: boolean; memberCount: number }>(
        `/groups/${group.id}/membership`,
      );
      setItems((current) =>
        current.map((g) =>
          g.id === group.id ? { ...g, joined: result.joined, memberCount: result.memberCount } : g,
        ),
      );
      startTransition(() => router.refresh());
    } catch (cause) {
      setError(cause instanceof ApiRequestError ? cause.message : "Não deu para atualizar agora");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      <div className="filter-row">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={`filter-chip ${filter === category ? "active" : ""}`}
            onClick={() => setFilter(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="group-grid">
        {visible.map((group) => (
          <article className="group-card" key={group.id}>
            <div className="tag">{group.category}</div>
            <h4>{group.name}</h4>
            <p>{group.description}</p>
            <div className="group-foot">
              <div className="avatars">
                {group.preview.map((member) => (
                  <div
                    className="avatar"
                    key={member.name}
                    style={{ background: member.color }}
                    title={member.name}
                  >
                    {member.initials}
                  </div>
                ))}
                {group.memberCount > group.preview.length ? (
                  <div className="avatar" style={{ background: "var(--ink-soft)" }}>
                    +{group.memberCount - group.preview.length}
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                className={`join-btn ${group.joined ? "joined" : ""}`}
                onClick={() => toggleJoin(group)}
                disabled={pendingId === group.id}
              >
                {group.joined ? "Participando ✓" : "Participar →"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
