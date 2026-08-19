import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth/current-user";
import { toErrorResponse } from "@/server/http";
import { archiveHabit } from "@/server/services/habits";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await requireUser();
    const { id } = await context.params;
    await archiveHabit(userId, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
