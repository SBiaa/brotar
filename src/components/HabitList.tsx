"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { ApiRequestError, api } from "@/lib/api";
import { categoryColor } from "@/lib/categories";
import type { HabitDto } from "@/lib/types";

type Props = {
  habits: HabitDto[];
  today: string;
  /** A aba Hábitos permite arquivar; a aba Hoje é só para marcar. */
  allowArchive?: boolean;
  emptyMessage: React.ReactNode;
};

export function HabitList({ habits, today, allowArchive = false, emptyMessage }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(habits);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Depois de router.refresh() o servidor manda uma lista nova; adotamos ela
  // durante a renderização, que é o jeito recomendado de ressincronizar estado
  // com props sem disparar um render em cascata via efeito.
  const [syncedFrom, setSyncedFrom] = useState(habits);
  if (syncedFrom !== habits) {
    setSyncedFrom(habits);
    setItems(habits);
  }

  function markPending(id: string, pending: boolean) {
    setPendingIds((ids) => (pending ? [...ids, id] : ids.filter((x) => x !== id)));
  }

  async function toggle(habit: HabitDto) {
    setError(null);
    markPending(habit.id, true);

    // Otimista: o check responde na hora, o número certo chega do servidor.
    setItems((current) =>
      current.map((h) =>
        h.id === habit.id
          ? { ...h, doneToday: !h.doneToday, streak: h.streak + (h.doneToday ? -1 : 1) }
          : h,
      ),
    );

    try {
      const { habit: updated } = await api.post<{ habit: HabitDto }>(
        `/habits/${habit.id}/toggle`,
        { date: today },
      );
      setItems((current) => current.map((h) => (h.id === updated.id ? updated : h)));
      // O jardim, as estatísticas e o mural vivem em outros componentes.
      startTransition(() => router.refresh());
    } catch (cause) {
      setItems((current) => current.map((h) => (h.id === habit.id ? habit : h)));
      setError(cause instanceof ApiRequestError ? cause.message : "Não deu para salvar agora");
    } finally {
      markPending(habit.id, false);
    }
  }

  async function archive(habit: HabitDto) {
    setError(null);
    setConfirmingId(null);
    markPending(habit.id, true);
    const snapshot = items;
    setItems((current) => current.filter((h) => h.id !== habit.id));

    try {
      await api.delete(`/habits/${habit.id}`);
      startTransition(() => router.refresh());
    } catch (cause) {
      setItems(snapshot);
      setError(cause instanceof ApiRequestError ? cause.message : "Não deu para remover agora");
    } finally {
      markPending(habit.id, false);
    }
  }

  if (items.length === 0) {
    return <div className="empty-state">{emptyMessage}</div>;
  }

  return (
    <>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="habit-list">
        {items.map((habit) => {
          const pending = pendingIds.includes(habit.id);
          return (
            <article className={`habit-card ${pending ? "pending" : ""}`} key={habit.id}>
              <button
                type="button"
                className={`check ${habit.doneToday ? "done" : ""}`}
                onClick={() => toggle(habit)}
                disabled={pending}
                aria-pressed={habit.doneToday}
                aria-label={`${habit.doneToday ? "Desmarcar" : "Marcar"} ${habit.name} hoje`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>

              <div className="habit-info">
                <div className="name">{habit.name}</div>
                <div className="meta">
                  <span style={{ color: categoryColor(habit.category) }}>{habit.category}</span> ·{" "}
                  {habit.consistency30}% nos últimos 30 dias
                </div>
              </div>

              <div className="mini-row" aria-hidden="true">
                {habit.last14.map((done, index) => (
                  <span
                    key={index}
                    className="mini-dot"
                    style={{ background: done ? "var(--moss)" : "var(--line)" }}
                  />
                ))}
              </div>

              <div className="streak-badge" title="Sequência atual">
                🔥 {habit.streak}
              </div>

              {allowArchive ? (
                confirmingId === habit.id ? (
                  <span className="panel-actions">
                    <button className="btn-ghost" type="button" onClick={() => setConfirmingId(null)}>
                      Cancelar
                    </button>
                    <button
                      className="habit-delete"
                      type="button"
                      onClick={() => archive(habit)}
                      disabled={pending}
                    >
                      Remover
                    </button>
                  </span>
                ) : (
                  <button
                    className="habit-delete"
                    type="button"
                    onClick={() => setConfirmingId(habit.id)}
                    aria-label={`Remover ${habit.name}`}
                    title="Remover hábito"
                  >
                    ✕
                  </button>
                )
              ) : null}
            </article>
          );
        })}
      </div>
    </>
  );
}
