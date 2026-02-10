import { NextResponse } from "next/server";
import history from "@/data/superlotto.json";
import sample from "@/data/superlotto.sample.json";
import { analyzeHistory, type SuperLottoDraw } from "@/lib/lotto";

export const runtime = "nodejs";

function normalize(arr: any[]): SuperLottoDraw[] {
  const data = (arr ?? []).map((d) => ({
    date: String(d.date),
    period: String(d.period ?? ""),
    zone1: (d.zone1 ?? []).map(Number),
    zone2: Number(d.zone2),
  }));
  data.sort((a, b) => a.date.localeCompare(b.date));
  return data;
}

export async function GET() {
  const real = normalize(history as any[]);
  const data = real.length ? real : normalize(sample as any[]);
  const a = analyzeHistory(data);
  return NextResponse.json({
    ok: true,
    source: real.length ? "data/superlotto.json" : "data/superlotto.sample.json",
    analysis: a,
  });
}
