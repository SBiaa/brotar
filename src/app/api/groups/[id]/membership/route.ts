import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth/current-user";
import { toErrorResponse } from "@/server/http";
import { toggleMembership } from "@/server/services/community";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await requireUser();
    const { id } = await context.params;
    return NextResponse.json(await toggleMembership(userId, id));
  } catch (error) {
    return toErrorResponse(error);
  }
}
