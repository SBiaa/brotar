import { isCategory } from "@/lib/categories";
import type { GardenDay, HabitDto } from "@/lib/types";

import { prisma } from "../db";
import { NotFoundError, ValidationError } from "../errors";
import { type IsoDate, addDays, lastDays, toIsoDate, todayIso } from "../dates";
import { recordMilestones } from "./feed";

export const GARDEN_DAYS = 182;

/** Janela máxima que carregamos do banco — limita o tamanho de uma sequência. */
const HISTORY_WINDOW = 400;

type LoadedHabit = {
  id: string;
  name: string;
  category: string;
  createdAt: IsoDate;
  dates: Set<IsoDate>;
};

async function loadHabits(userId: string, today: IsoDate): Promise<LoadedHabit[]> {
  const since = addDays(today, -(HISTORY_WINDOW - 1));

  const rows = await prisma.habit.findMany({
    where: { userId, archivedAt: null },
    orderBy: { createdAt: "asc" },
    include: {
      entries: {
        where: { date: { gte: since, lte: today } },
        select: { date: true },
      },
    },
  });

  return rows.map((habit) => ({
    id: habit.id,
    name: habit.name,
    category: habit.category,
    createdAt: toIsoDate(habit.createdAt),
    dates: new Set(habit.entries.map((e) => e.date)),
  }));
}

/**
 * Sequência atual. O dia de hoje ainda em aberto não quebra a contagem — só
 * quebra quando um dia já encerrado ficou vazio. É a regra do protótipo, e é o
 * que faz o app não punir quem ainda não marcou nada de manhã.
 */
export function streakOf(dates: Set<IsoDate>, today: IsoDate): number {
  let cursor = dates.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (dates.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function consistency(dates: Set<IsoDate>, today: IsoDate, days: number): number {
  const window = lastDays(days, today);
  const done = window.filter((d) => dates.has(d)).length;
  return Math.round((done / days) * 100);
}

function toDto(habit: LoadedHabit, today: IsoDate): HabitDto {
  return {
    id: habit.id,
    name: habit.name,
    category: habit.category,
    createdAt: habit.createdAt,
    doneToday: habit.dates.has(today),
    streak: streakOf(habit.dates, today),
    consistency30: consistency(habit.dates, today, 30),
    last14: lastDays(14, today).map((d) => habit.dates.has(d)),
  };
}

export async function listHabits(userId: string, today = todayIso()): Promise<HabitDto[]> {
  const habits = await loadHabits(userId, today);
  return habits.map((h) => toDto(h, today));
}

/**
 * O jardim mede o dia contra os hábitos que já existiam naquele dia — quem
 * começou ontem não deve ver 180 dias de "falhas" atrás de si.
 */
export function buildGarden(habits: LoadedHabit[], today: IsoDate): GardenDay[] {
  return lastDays(GARDEN_DAYS, today).map((date) => {
    const active = habits.filter((h) => h.createdAt <= date);
    const done = active.filter((h) => h.dates.has(date)).length;
    const total = active.length;
    return { date, done, total, level: levelFor(done, total) };
  });
}

export function levelFor(done: number, total: number): GardenDay["level"] {
  if (done === 0 || total === 0) return 0;
  const ratio = done / total;
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
}

export async function getHabitOverview(userId: string, today = todayIso()) {
  const habits = await loadHabits(userId, today);
  const dtos = habits.map((h) => toDto(h, today));

  return {
    habits: dtos,
    garden: buildGarden(habits, today),
    stats: {
      longestActiveStreak: dtos.reduce((max, h) => Math.max(max, h.streak), 0),
      avgConsistency30: dtos.length
        ? Math.round(dtos.reduce((sum, h) => sum + h.consistency30, 0) / dtos.length)
        : 0,
      activeHabits: dtos.length,
    },
  };
}

export async function createHabit(
  userId: string,
  input: { name: string; category: string },
): Promise<HabitDto> {
  const name = input.name.trim();
  if (name.length < 2) throw new ValidationError("Dê um nome com pelo menos 2 letras");
  if (name.length > 80) throw new ValidationError("Nome muito longo (máx. 80 caracteres)");
  if (!isCategory(input.category)) throw new ValidationError("Categoria inválida");

  const today = todayIso();
  const habit = await prisma.habit.create({
    data: { userId, name, category: input.category },
  });

  return toDto(
    {
      id: habit.id,
      name: habit.name,
      category: habit.category,
      createdAt: toIsoDate(habit.createdAt),
      dates: new Set(),
    },
    today,
  );
}

/** Arquiva em vez de apagar: o histórico continua valendo se o hábito voltar. */
export async function archiveHabit(userId: string, habitId: string): Promise<void> {
  const result = await prisma.habit.updateMany({
    where: { id: habitId, userId, archivedAt: null },
    data: { archivedAt: new Date() },
  });
  if (result.count === 0) throw new NotFoundError("Hábito não encontrado");
}

export async function toggleHabit(
  userId: string,
  habitId: string,
  date: IsoDate,
): Promise<HabitDto> {
  const today = todayIso();
  if (date > today) throw new ValidationError("Não dá para marcar um dia que ainda não chegou");

  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId, archivedAt: null },
    select: { id: true, name: true, category: true, createdAt: true },
  });
  if (!habit) throw new NotFoundError("Hábito não encontrado");

  const existing = await prisma.habitEntry.findUnique({
    where: { habitId_date: { habitId, date } },
    select: { id: true },
  });

  if (existing) {
    await prisma.habitEntry.delete({ where: { id: existing.id } });
  } else {
    await prisma.habitEntry.create({ data: { habitId, date } });
  }

  const entries = await prisma.habitEntry.findMany({
    where: { habitId, date: { gte: addDays(today, -(HISTORY_WINDOW - 1)), lte: today } },
    select: { date: true },
  });

  const loaded: LoadedHabit = {
    id: habit.id,
    name: habit.name,
    category: habit.category,
    createdAt: toIsoDate(habit.createdAt),
    dates: new Set(entries.map((e) => e.date)),
  };

  const dto = toDto(loaded, today);

  if (!existing) {
    // Só celebra quando o dia foi marcado, nunca quando foi desmarcado.
    await recordMilestones(userId, {
      habitName: habit.name,
      streak: dto.streak,
      dates: loaded.dates,
      today,
    });
  }

  return dto;
}
