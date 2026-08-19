import { avatarColor, initials } from "@/lib/categories";
import type { FeedItemDto } from "@/lib/types";

import { prisma } from "../db";
import { type IsoDate, addDays, timeAgo } from "../dates";

export const REACTIONS = ["👏", "🔥"] as const;
export type ReactionEmoji = (typeof REACTIONS)[number];

export function isReaction(value: string): value is ReactionEmoji {
  return (REACTIONS as readonly string[]).includes(value);
}

export const FEED_EVENT_TYPES = {
  streak: "STREAK",
  restart: "RESTART",
  joinGroup: "JOIN_GROUP",
  firstHabit: "FIRST_HABIT",
} as const;

/** Marcos que valem um post no mural. */
const STREAK_MILESTONES = [7, 14, 30, 60, 100, 180, 365];

/** Dias parados a partir dos quais voltar conta como recomeço. */
const RESTART_GAP = 3;

export async function emitEvent(
  userId: string,
  type: string,
  message: string,
  options: { dedupeWindowHours?: number } = {},
): Promise<void> {
  // Desmarcar e remarcar o mesmo dia não deve encher o mural com o mesmo post.
  if (options.dedupeWindowHours) {
    const since = new Date(Date.now() - options.dedupeWindowHours * 3_600_000);
    const existing = await prisma.feedEvent.findFirst({
      where: { userId, type, message, createdAt: { gte: since } },
      select: { id: true },
    });
    if (existing) return;
  }

  await prisma.feedEvent.create({ data: { userId, type, message } });
}

/**
 * Chamado quando alguém marca um dia. Publica sequência redonda e recomeço —
 * o recomeço é de propósito tão comemorado quanto a sequência.
 */
export async function recordMilestones(
  userId: string,
  input: { habitName: string; streak: number; dates: Set<IsoDate>; today: IsoDate },
): Promise<void> {
  const { habitName, streak, dates, today } = input;

  if (STREAK_MILESTONES.includes(streak)) {
    await emitEvent(
      userId,
      FEED_EVENT_TYPES.streak,
      `completou <b>${streak} dias seguidos</b> de ${habitName} 🌿`,
      { dedupeWindowHours: 24 },
    );
    return;
  }

  if (streak === 1) {
    const gap = gapBefore(dates, today);
    if (gap >= RESTART_GAP) {
      await emitEvent(
        userId,
        FEED_EVENT_TYPES.restart,
        `recomeçou <b>${habitName}</b> depois de ${gap} dias de pausa — e está tudo bem 🌱`,
        { dedupeWindowHours: 24 },
      );
    }
  }
}

/** Quantos dias vazios existem imediatamente antes de `today`. */
function gapBefore(dates: Set<IsoDate>, today: IsoDate, limit = 120): number {
  let gap = 0;
  let cursor = addDays(today, -1);
  while (gap < limit && !dates.has(cursor)) {
    gap++;
    cursor = addDays(cursor, -1);
  }
  // Se nunca houve nada antes, não é recomeço: é começo.
  return dates.size > 1 && gap < limit ? gap : 0;
}

export async function listFeed(userId: string, limit = 20): Promise<FeedItemDto[]> {
  const events = await prisma.feedEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { id: true, name: true } },
      reactions: { select: { emoji: true, userId: true } },
    },
  });

  return events.map((event) => ({
    id: event.id,
    authorName: event.user.name,
    initials: initials(event.user.name),
    color: avatarColor(event.user.id),
    message: event.message,
    timeAgo: timeAgo(event.createdAt),
    isMine: event.userId === userId,
    reactions: REACTIONS.map((emoji) => {
      const forEmoji = event.reactions.filter((r) => r.emoji === emoji);
      return {
        emoji,
        count: forEmoji.length,
        mine: forEmoji.some((r) => r.userId === userId),
      };
    }),
  }));
}

export async function toggleReaction(
  userId: string,
  eventId: string,
  emoji: string,
): Promise<{ emoji: string; count: number; mine: boolean }> {
  if (!isReaction(emoji)) {
    throw new Error(`Reação não suportada: ${emoji}`);
  }

  const existing = await prisma.reaction.findUnique({
    where: { eventId_userId_emoji: { eventId, userId, emoji } },
    select: { id: true },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.reaction.create({ data: { eventId, userId, emoji } });
  }

  const count = await prisma.reaction.count({ where: { eventId, emoji } });
  return { emoji, count, mine: !existing };
}
