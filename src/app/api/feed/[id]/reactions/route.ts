import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth/current-user";
import { ValidationError } from "@/server/errors";
import { readJson, toErrorResponse } from "@/server/http";
import { isReaction, toggleReaction } from "@/server/services/feed";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await requireUser();
    const { id } = await context.params;

    const body = (await readJson(request)) as { emoji?: string };
    const emoji = String(body.emoji ?? "");
    if (!isReaction(emoji)) throw new ValidationError("Reação não suportada");

    return NextResponse.json(await toggleReaction(userId, id, emoji));
  } catch (error) {
    return toErrorResponse(error);
  }
}
