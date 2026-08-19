import { avatarColor, initials } from "@/lib/categories";
import type { GroupDto } from "@/lib/types";

import { prisma } from "../db";
import { NotFoundError } from "../errors";
import { FEED_EVENT_TYPES, emitEvent } from "./feed";

const PREVIEW_AVATARS = 4;

export async function listGroups(userId: string, category?: string): Promise<GroupDto[]> {
  const groups = await prisma.group.findMany({
    where: category && category !== "Todos" ? { category } : undefined,
    orderBy: { createdAt: "asc" },
    include: {
      memberships: {
        orderBy: { joinedAt: "asc" },
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  return groups.map((group) => ({
    id: group.id,
    slug: group.slug,
    name: group.name,
    category: group.category,
    description: group.description,
    memberCount: group.memberships.length,
    joined: group.memberships.some((m) => m.userId === userId),
    preview: group.memberships.slice(0, PREVIEW_AVATARS).map((m) => ({
      name: m.user.name,
      initials: initials(m.user.name),
      color: avatarColor(m.user.id),
    })),
  }));
}

export async function listCategories(): Promise<string[]> {
  const rows = await prisma.group.findMany({
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" },
  });
  return ["Todos", ...rows.map((r) => r.category)];
}

export async function toggleMembership(
  userId: string,
  groupId: string,
): Promise<{ joined: boolean; memberCount: number }> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { id: true, name: true },
  });
  if (!group) throw new NotFoundError("Grupo não encontrado");

  const existing = await prisma.membership.findUnique({
    where: { userId_groupId: { userId, groupId } },
    select: { id: true },
  });

  if (existing) {
    await prisma.membership.delete({ where: { id: existing.id } });
  } else {
    await prisma.membership.create({ data: { userId, groupId } });
    await emitEvent(
      userId,
      FEED_EVENT_TYPES.joinGroup,
      `entrou no grupo <b>${group.name}</b> 🤝`,
      { dedupeWindowHours: 24 },
    );
  }

  const memberCount = await prisma.membership.count({ where: { groupId } });
  return { joined: !existing, memberCount };
}
