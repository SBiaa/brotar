/**
 * Datas do Brotar são sempre "dias de calendário" (YYYY-MM-DD), nunca instantes.
 * Marcar um hábito às 23h no Brasil tem que cair no dia de hoje, não no de
 * amanhã em UTC — por isso o dia é resolvido num fuso explícito.
 */

export const APP_TIMEZONE = process.env.APP_TIMEZONE ?? "America/Sao_Paulo";

export type IsoDate = string; // YYYY-MM-DD

const isoFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Dia de calendário de um instante, no fuso do app. */
export function toIsoDate(instant: Date): IsoDate {
  return isoFormatter.format(instant); // en-CA já formata como YYYY-MM-DD
}

/** Dia de calendário atual no fuso do app. */
export function todayIso(now: Date = new Date()): IsoDate {
  return toIsoDate(now);
}

export function isIsoDate(value: string): value is IsoDate {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

/** Soma (ou subtrai) dias sem esbarrar em horário de verão. */
export function addDays(date: IsoDate, days: number): IsoDate {
  const [y, m, d] = date.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
}

export function daysBetween(from: IsoDate, to: IsoDate): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

/** Os últimos `count` dias terminando em `end`, do mais antigo para o mais novo. */
export function lastDays(count: number, end: IsoDate = todayIso()): IsoDate[] {
  const out: IsoDate[] = [];
  for (let i = count - 1; i >= 0; i--) {
    out.push(addDays(end, -i));
  }
  return out;
}

/** Rótulo curto para tooltip: "14 de mar." */
export function formatShort(date: IsoDate): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
  }).format(new Date(`${date}T00:00:00Z`));
}

/** Rótulo do topo do dashboard: "terça-feira, 18 de agosto" */
export function formatLong(date: IsoDate): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date(`${date}T00:00:00Z`));
}

/** "há 12 min", "há 2h", "há 3 d" */
export function timeAgo(value: Date, now: Date = new Date()): string {
  const seconds = Math.max(0, Math.floor((now.getTime() - value.getTime()) / 1000));
  if (seconds < 60) return "agora há pouco";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days} d`;
  const months = Math.floor(days / 30);
  return `há ${months} ${months === 1 ? "mês" : "meses"}`;
}

/** Hora local no fuso do app, para escolher entre bom dia / boa tarde / boa noite. */
export function currentHour(now: Date = new Date()): number {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    hour12: false,
  }).format(now);
  return Number(hour);
}
