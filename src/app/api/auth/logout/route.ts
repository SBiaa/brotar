import { NextResponse } from "next/server";

import { endSession } from "@/server/auth/session";
import { toErrorResponse } from "@/server/http";

export async function POST() {
  try {
    await endSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
