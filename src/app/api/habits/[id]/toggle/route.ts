import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth/current-user";
import { isIsoDate, todayIso } from "@/server/dates";
import { ValidationError } from "@/server/errors";
import { readJson, toErrorResponse } from "@/server/http";
import { toggleHabit } from "@/server/services/habits";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await requireUser();
    const { id } = await context.params;

    const body = (await readJson(request)) as { date?: string };
    const date = body.date ?? todayIso();
    if (!isIsoDate(date)) throw new ValidationError("Data inválida");

    return NextResponse.json({ habit: await toggleHabit(userId, id, date) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
