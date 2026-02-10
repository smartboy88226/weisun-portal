import { NextResponse } from "next/server";
import history from "@/data/superlotto.json";
import sample from "@/data/superlotto.sample.json";
import { predict, type PredictMode, type SuperLottoDraw } from "@/lib/lotto";

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

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = (url.searchParams.get("mode") ?? "balanced") as PredictMode;
  const real = normalize(history as any[]);
  const data = real.length ? real : normalize(sample as any[]);
  const result = predict(data, mode);
  return NextResponse.json({
    ok: true,
    source: real.length ? "data/superlotto.json" : "data/superlotto.sample.json",
    result,
  });
}
