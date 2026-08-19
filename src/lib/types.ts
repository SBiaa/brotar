/**
 * DTOs trocados entre servidor e cliente.
 * Sem import de Prisma ou de nada de servidor: componentes client importam daqui.
 */

export type HabitDto = {
  id: string;
  name: string;
  category: string;
  createdAt: string; // YYYY-MM-DD
  doneToday: boolean;
  streak: number;
  consistency30: number; // 0..100
  last14: boolean[]; // do mais antigo ao mais recente
};

export type GardenDay = {
  date: string; // YYYY-MM-DD
  done: number;
  total: number;
  level: 0 | 1 | 2 | 3 | 4;
};

export type DashboardDto = {
  today: string;
  greeting: string;
  dateLabel: string;
  garden: GardenDay[];
  habits: HabitDto[];
  stats: {
    longestActiveStreak: number;
    avgConsistency30: number;
    activeHabits: number;
  };
};

export type GroupDto = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  memberCount: number;
  joined: boolean;
  preview: { name: string; initials: string; color: string }[];
};

export type FeedItemDto = {
  id: string;
  authorName: string;
  initials: string;
  color: string;
  message: string; // pode conter <b>…</b>
  timeAgo: string;
  isMine: boolean;
  reactions: { emoji: string; count: number; mine: boolean }[];
};

export type BadgeDto = {
  key: string;
  icon: string;
  name: string;
  description: string;
  unlocked: boolean;
};

export type ProfileDto = {
  name: string;
  email: string;
  initials: string;
  memberSince: string;
  activeHabits: number;
  stats: {
    longestStreak: number;
    activeHabits: number;
    daysOnBrotar: number;
    groups: number;
  };
  badges: BadgeDto[];
};

export type ApiError = { error: string };
