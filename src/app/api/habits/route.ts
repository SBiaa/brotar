import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth/current-user";
import { readJson, toErrorResponse } from "@/server/http";
import { createHabit, listHabits } from "@/server/services/habits";

export async function GET() {
  try {
    const { id: userId } = await requireUser();
    return NextResponse.json({ habits: await listHabits(userId) });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { id: userId } = await requireUser();
    const body = (await readJson(request)) as { name?: string; category?: string };
    const habit = await createHabit(userId, {
      name: String(body.name ?? ""),
      category: String(body.category ?? ""),
    });
    return NextResponse.json({ habit }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
