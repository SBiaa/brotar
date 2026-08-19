import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth/current-user";
import { toErrorResponse } from "@/server/http";
import { listFeed } from "@/server/services/feed";

export async function GET() {
  try {
    const { id: userId } = await requireUser();
    return NextResponse.json({ feed: await listFeed(userId) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
