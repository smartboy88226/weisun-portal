import { NextResponse } from "next/server";
import { drawRandom } from "@/lib/lotto";

export const runtime = "nodejs";

export async function GET() {
  const result = drawRandom();
  return NextResponse.json({ ok: true, ...result, generatedAt: new Date().toISOString() });
}
