import type { DashboardDto } from "@/lib/types";

import { currentHour, formatLong, todayIso } from "../dates";
import { getHabitOverview } from "./habits";

function timeGreeting(hour = currentHour()): string {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export async function getDashboard(userId: string, name: string): Promise<DashboardDto> {
  const today = todayIso();
  const { habits, garden, stats } = await getHabitOverview(userId, today);

  const firstName = name.trim().split(/\s+/)[0] || "por aí";
  const done = habits.filter((h) => h.doneToday).length;

  const greeting = habits.length
    ? `${timeGreeting()}, ${firstName}. Você já regou ${done} de ${habits.length} ${
        habits.length === 1 ? "hábito" : "hábitos"
      } hoje.`
    : `${timeGreeting()}, ${firstName}. Comece de onde você está.`;

  return {
    today,
    greeting,
    dateLabel: formatLong(today),
    garden,
    habits,
    stats,
  };
}
