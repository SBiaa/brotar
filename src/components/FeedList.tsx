"use client";

import { useState } from "react";

import { ApiRequestError, api } from "@/lib/api";
import type { FeedItemDto } from "@/lib/types";

/**
 * As mensagens do mural trazem <b>…</b> para destacar o número da sequência,
 * e trazem também nome de hábito digitado por gente. Em vez de injetar HTML,
 * quebramos a string em nós React: o negrito funciona e o resto vira texto,
 * escapado pelo próprio React.
 */
function renderMessage(message: string): React.ReactNode[] {
  return message.split(/(<b>.*?<\/b>)/g).map((chunk, index) => {
    const bold = chunk.match(/^<b>(.*?)<\/b>$/);
    return bold ? <b key={index}>{bold[1]}</b> : <span key={index}>{chunk}</span>;
  });
}

export function FeedList({ items }: { items: FeedItemDto[] }) {
  const [feed, setFeed] = useState(items);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Ressincroniza com o servidor durante a renderização (ver HabitList).
  const [syncedFrom, setSyncedFrom] = useState(items);
  if (syncedFrom !== items) {
    setSyncedFrom(items);
    setFeed(items);
  }

  async function react(itemId: string, emoji: string) {
    setError(null);
    setPending(`${itemId}:${emoji}`);
    try {
      const result = await api.post<{ emoji: string; count: number; mine: boolean }>(
        `/feed/${itemId}/reactions`,
        { emoji },
      );
      setFeed((current) =>
        current.map((item) =>
          item.id === itemId
            ? {
                ...item,
                reactions: item.reactions.map((r) =>
                  r.emoji === emoji ? { ...r, count: result.count, mine: result.mine } : r,
                ),
              }
            : item,
        ),
      );
    } catch (cause) {
      setError(cause instanceof ApiRequestError ? cause.message : "Não deu para reagir agora");
    } finally {
      setPending(null);
    }
  }

  if (feed.length === 0) {
    return (
      <div className="empty-state">
        Ainda não há conquistas por aqui. Marque um hábito e o mural começa a encher.
      </div>
    );
  }

  return (
    <>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="feed">
        {feed.map((item) => (
          <article className="feed-item" key={item.id}>
            <div className="fav" style={{ background: item.color }}>
              {item.initials}
            </div>

            <div>
              <div className="feed-text">
                <b>{item.isMine ? "Você" : item.authorName}</b> {renderMessage(item.message)}
              </div>
              <div className="feed-time">{item.timeAgo}</div>
            </div>

            <div className="reactions">
              {item.reactions.map((reaction) => (
                <button
                  key={reaction.emoji}
                  type="button"
                  className={`react-btn ${reaction.mine ? "mine" : ""}`}
                  onClick={() => react(item.id, reaction.emoji)}
                  disabled={pending === `${item.id}:${reaction.emoji}`}
                  aria-label={`Reagir com ${reaction.emoji}`}
                >
                  <span>{reaction.emoji}</span>
                  {reaction.count > 0 ? <span className="count">{reaction.count}</span> : null}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
