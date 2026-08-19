export const CATEGORIES = ["Movimento", "Mente", "Estudo", "Criação", "Bem-estar"] as const;

export type Category = (typeof CATEGORIES)[number];

const COLORS: Record<Category, string> = {
  Movimento: "#5C7A5E",
  Mente: "#E0A458",
  Estudo: "#C9603F",
  Criação: "#8C7BB5",
  "Bem-estar": "#4E8DA8",
};

const FALLBACK = "#726B5E";

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

export function categoryColor(value: string): string {
  return isCategory(value) ? COLORS[value] : FALLBACK;
}

/** Cor estável por nome, para avatares de gente do feed e dos grupos. */
export function avatarColor(seed: string): string {
  const palette = ["#5C7A5E", "#E0A458", "#C9603F", "#4E8DA8", "#8C7BB5"];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return palette[hash % palette.length];
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
