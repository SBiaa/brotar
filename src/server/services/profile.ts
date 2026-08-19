import { initials } from "@/lib/categories";
import type { BadgeDto, ProfileDto } from "@/lib/types";

import { prisma } from "../db";
import { type IsoDate, addDays, daysBetween, toIsoDate, todayIso } from "../dates";
import { FEED_EVENT_TYPES } from "./feed";
import { consistency, streakOf } from "./habits";

/** Maior sequência já alcançada, mesmo que tenha sido interrompida depois. */
export function longestRun(dates: Set<IsoDate>): number {
  let best = 0;
  for (const date of dates) {
    // Só conta a partir do começo de uma sequência, para não recontar o meio.
    if (dates.has(addDays(date, -1))) continue;
    let length = 0;
    let cursor = date;
    while (dates.has(cursor)) {
      length++;
      cursor = addDays(cursor, 1);
    }
    best = Math.max(best, length);
  }
  return best;
}

export async function getProfile(userId: string, today = todayIso()): Promise<ProfileDto> {
  const [user, habits, groupCount, restartEvent] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true, email: true, createdAt: true },
    }),
    prisma.habit.findMany({
      where: { userId, archivedAt: null },
      include: { entries: { select: { date: true } } },
    }),
    prisma.membership.count({ where: { userId } }),
    prisma.feedEvent.findFirst({
      where: { userId, type: FEED_EVENT_TYPES.restart },
      select: { id: true },
    }),
  ]);

  const sets = habits.map((h) => new Set(h.entries.map((e) => e.date)));
  const totalEntries = sets.reduce((sum, s) => sum + s.size, 0);
  const bestEver = sets.reduce((max, s) => Math.max(max, longestRun(s)), 0);
  const bestActive = sets.reduce((max, s) => Math.max(max, streakOf(s, today)), 0);
  const bestConsistency = sets.reduce((max, s) => Math.max(max, consistency(s, today, 30)), 0);
  const daysOnBrotar = daysBetween(toIsoDate(user.createdAt), today) + 1;

  const badges: BadgeDto[] = [
    {
      key: "primeiro-broto",
      icon: "🌱",
      name: "Primeiro broto",
      description: "1º dia registrado",
      unlocked: totalEntries >= 1,
    },
    {
      key: "uma-semana",
      icon: "🔥",
      name: "Uma semana",
      description: "7 dias seguidos",
      unlocked: bestEver >= 7,
    },
    {
      key: "recomeco",
      icon: "🌤️",
      name: "Recomeço",
      description: "Voltou após uma pausa",
      unlocked: Boolean(restartEvent),
    },
    {
      key: "raizes-fortes",
      icon: "🌳",
      name: "Raízes fortes",
      description: "30 dias seguidos",
      unlocked: bestEver >= 30,
    },
    {
      key: "em-comunidade",
      icon: "🤝",
      name: "Em comunidade",
      description: "Entrou em 1 grupo",
      unlocked: groupCount >= 1,
    },
    {
      key: "constancia",
      icon: "✨",
      name: "Constância",
      description: "90% em 30 dias",
      unlocked: bestConsistency >= 90,
    },
    {
      key: "floresceu",
      icon: "🌻",
      name: "Floresceu",
      description: "3 hábitos ativos",
      unlocked: habits.length >= 3,
    },
    {
      key: "cem-dias",
      icon: "🏔️",
      name: "100 dias",
      description: "Sequência de 100 dias",
      unlocked: bestEver >= 100,
    },
  ];

  return {
    name: user.name,
    email: user.email,
    initials: initials(user.name),
    memberSince: new Intl.DateTimeFormat("pt-BR", {
      timeZone: "UTC",
      month: "long",
      year: "numeric",
    }).format(new Date(`${toIsoDate(user.createdAt)}T00:00:00Z`)),
    activeHabits: habits.length,
    stats: {
      longestStreak: Math.max(bestEver, bestActive),
      activeHabits: habits.length,
      daysOnBrotar,
      groups: groupCount,
    },
    badges,
  };
}
