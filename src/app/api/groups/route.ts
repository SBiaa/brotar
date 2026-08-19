import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth/current-user";
import { toErrorResponse } from "@/server/http";
import { listCategories, listGroups } from "@/server/services/community";

export async function GET(request: Request) {
  try {
    const { id: userId } = await requireUser();
    const category = new URL(request.url).searchParams.get("category") ?? undefined;

    const [groups, categories] = await Promise.all([
      listGroups(userId, category),
      listCategories(),
    ]);

    return NextResponse.json({ groups, categories });
  } catch (error) {
    return toErrorResponse(error);
  }
}
