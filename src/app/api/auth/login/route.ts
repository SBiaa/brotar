import { NextResponse } from "next/server";

import { startSession } from "@/server/auth/session";
import { readJson, toErrorResponse } from "@/server/http";
import { login } from "@/server/services/accounts";

export async function POST(request: Request) {
  try {
    const session = await login(await readJson(request));
    await startSession(session);
    return NextResponse.json({ user: { name: session.name, email: session.email } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
