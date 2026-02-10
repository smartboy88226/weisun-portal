"use client";

import { useEffect, useMemo, useState } from "react";
import { BallRow } from "@/components/Balls";

type Draw = { date: string; zone1: number[]; zone2: number };

const STORAGE_KEY = "weisun_superlotto_history_v2";

function tryParseDate(s: string): number | null {
  const m = s.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]) - 1, d = Number(m[3]);
  const t = new Date(y, mo, d).getTime();
  return Number.isFinite(t) ? t : null;
}

function parseCSV(text: string): Draw[] {
  const lines = text.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  if (lines.length <= 1) return [];
  const rows = lines.slice(1).map((ln) => ln.split(",").map((x) => x.trim()));
  const out: Draw[] = [];
  for (const r of rows) {
    const nums = r.map((x) => Number(x)).filter((n) => Number.isFinite(n));
    const zone1: number[] = [];
    for (const n of nums) if (n >= 1 && n <= 38 && zone1.length < 6) zone1.push(n);
    const sp = nums.find((n) => n >= 1 && n <= 8 && !zone1.includes(n)) ?? nums.find((n) => n >= 1 && n <= 8);
    const date = r.find((x) => /\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/.test(x)) ?? r[0] ?? "";
    if (zone1.length === 6 && sp) {
      out.push({ date, zone1: zone1.sort((a, b) => a - b), zone2: sp });
    }
  }
  return out;
}

function parseJSON(text: string): Draw[] {
  const data = JSON.parse(text);
  if (!Array.isArray(data)) return [];
  const out: Draw[] = [];
  for (const x of data) {
    const date = String(x.date ?? x.drawDate ?? "");
    const z1 = (x.zone1 ?? x.numbers ?? x.first ?? []) as any[];
    const z2 = Number(x.zone2 ?? x.special ?? x.second ?? x.sp ?? NaN);
    const zone1 = Array.isArray(z1)
      ? z1.map(Number).filter((n) => Number.isFinite(n) && n >= 1 && n <= 38).slice(0, 6)
      : [];
    if (zone1.length === 6 && Number.isFinite(z2) && z2 >= 1 && z2 <= 8) {
      out.push({ date, zone1: zone1.sort((a, b) => a - b), zone2: z2 });
    }
  }
  return out;
}

function readStore(): Draw[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data as Draw[];
  } catch {
    return [];
  }
}

function writeStore(draws: Draw[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draws));
  } catch {}
}

function keyOf(d: Draw) {
  return `${d.date}|${d.zone1.join("-")}|${d.zone2}`;
}

function mergeDraws(existing: Draw[], incoming: Draw[]) {
  const map = new Map<string, Draw>();
  for (const d of existing) map.set(keyOf(d), d);
  for (const d of incoming) map.set(keyOf(d), d);
  return Array.from(map.values());
}

function weightedSampleNoReplace(items: number[], weights: number[], k: number): number[] {
  const chosen: number[] = [];
  const pool = items.slice();
  const wts = weights.slice();
  for (let t = 0; t < k && pool.length; t++) {
    const sum = wts.reduce((a, b) => a + b, 0);
    let r = Math.random() * sum;
    let idx = 0;
    for (; idx < pool.length; idx++) {
      r -= wts[idx];
      if (r <= 0) break;
    }
    idx = Math.min(idx, pool.length - 1);
    chosen.push(pool[idx]);
    pool.splice(idx, 1);
    wts.splice(idx, 1);
  }
  return chosen;
}

function makePrediction(draws: Draw[]) {
  // Probability model (entertainment):
  // Dirichlet smoothing + mild recency weighting -> weighted sampling without replacement
  const now = Date.now();
  const alpha = 0.65; // smoothing (keeps it close to uniform)
  const decayPerDay = 0.997; // mild recency (very gentle)

  const w1 = new Array(38).fill(alpha);
  const w2 = new Array(8).fill(alpha);

  for (const d of draws) {
    const t = tryParseDate(d.date);
    const ageDays = t ? Math.max(0, (now - t) / (1000 * 3600 * 24)) : 0;
    const rec = Math.pow(decayPerDay, ageDays); // in (0,1]
    for (const n of d.zone1) w1[n - 1] += rec;
    w2[d.zone2 - 1] += rec;
  }

  const items1 = Array.from({ length: 38 }, (_, i) => i + 1);
  const items2 = Array.from({ length: 8 }, (_, i) => i + 1);

  const pick1 = weightedSampleNoReplace(items1, w1, 6).sort((a, b) => a - b);
  // zone2 pick by weight
  const sum2 = w2.reduce((a, b) => a + b, 0);
  let r = Math.random() * sum2;
  let pick2 = 1;
  for (let i = 0; i < w2.length; i++) {
    r -= w2[i];
    if (r <= 0) { pick2 = i + 1; break; }
  }

  return { zone1: pick1, zone2: pick2 };
}

export default function AnalysisPage() {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [err, setErr] = useState<string>("");
  const [prediction, setPrediction] = useState<{ zone1: number[]; zone2: number } | null>(null);

  useEffect(() => {
    const loaded = readStore();
    setDraws(loaded);
    if (loaded.length) setPrediction(makePrediction(loaded));
  }, []);

  const freq1 = useMemo(() => {
    const m = new Map<number, number>();
    for (const d of draws) for (const n of d.zone1) m.set(n, (m.get(n) ?? 0) + 1);
    return Array.from(m.entries()).map(([n, v]) => ({ n, v })).sort((a, b) => b.v - a.v || a.n - b.n);
  }, [draws]);

  const freq2 = useMemo(() => {
    const m = new Map<number, number>();
    for (const d of draws) m.set(d.zone2, (m.get(d.zone2) ?? 0) + 1);
    return Array.from(m.entries()).map(([n, v]) => ({ n, v })).sort((a, b) => b.v - a.v || a.n - b.n);
  }, [draws]);

  const drawsSorted = useMemo(() => {
    const toTime = (s: string) => tryParseDate(s) ?? NaN;
    return [...draws].sort((a, b) => (toTime(b.date) || 0) - (toTime(a.date) || 0));
  }, [draws]);

  async function onUpload(file: File) {
    setErr("");
    const text = await file.text();

    let parsed: Draw[] = [];
    try {
      if (file.name.toLowerCase().endsWith(".json")) parsed = parseJSON(text);
      else parsed = parseCSV(text);
    } catch {
      setErr("檔案解析失敗");
      return;
    }

    if (!parsed.length) {
      setErr("沒有解析到資料");
      return;
    }

    setDraws((prev) => {
      const merged = mergeDraws(prev, parsed);
      writeStore(merged);
      setPrediction(makePrediction(merged));
      return merged;
    });
  }

  function clear() {
    writeStore([]);
    setDraws([]);
    setPrediction(null);
    setErr("");
  }

  function regen() {
    if (!draws.length) return;
    setPrediction(makePrediction(draws));
  }

  return (
    <div className="space-y-6">
      <div className="card card-pad">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold tracking-tight">歷史統計</h1>
          <div className="flex gap-2">
            <label className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 cursor-pointer">
              匯入
              <input
                type="file"
                accept=".csv,.json,text/csv,application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  onUpload(f);
                  e.target.value = "";
                }}
              />
            </label>
            <button onClick={clear} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100">
              清空
            </button>
          </div>
        </div>
        <div className="mt-2 text-sm text-slate-700">筆數：{draws.length}</div>
        {err ? <div className="mt-2 text-sm text-red-600">{err}</div> : null}
      </div>

      <div className="card card-pad">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-900">預測結果（娛樂）</div>
          <button onClick={regen} disabled={!draws.length} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 disabled:opacity-50">
            重新產生
          </button>
        </div>
        <div className="mt-4">
          {prediction ? (
            <BallRow zone1={prediction.zone1} zone2={prediction.zone2} />
          ) : (
            <div className="text-sm text-slate-600">尚未匯入資料。</div>
          )}
        </div>
        <div className="mt-3 text-xs text-slate-500">
          使用「平滑化＋輕微近因加權」的機率抽樣產生，僅供娛樂。
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="第一區 出現次數排行">
          <BarList items={freq1.map((x) => ({ label: x.n.toString().padStart(2, "0"), value: x.v }))} />
        </Panel>
        <Panel title="第二區 出現次數排行">
          <BarList items={freq2.map((x) => ({ label: x.n.toString(), value: x.v }))} />
        </Panel>
      </div>

      <div className="card card-pad">
        <h2 className="text-base font-semibold">歷年開獎（新 → 舊）</h2>
        <div className="mt-4 space-y-3">
          {drawsSorted.length ? (
            drawsSorted.map((d, idx) => (
              <div key={idx} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-medium text-slate-700">{d.date || "—"}</div>
                <div className="min-w-[260px]">
                  <BallRow zone1={d.zone1} zone2={d.zone2} />
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-slate-600">尚未匯入資料。</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card card-pad">
      <h3 className="text-base font-semibold">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function BarList({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(1, ...items.map((x) => x.value));
  return (
    <div className="space-y-2">
      {items.slice(0, 20).map((x) => (
        <div key={x.label} className="flex items-center gap-3">
          <div className="w-10 text-right font-mono text-xs text-slate-600">{x.label}</div>
          <div className="h-3 flex-1 rounded bg-slate-100">
            <div className="h-3 rounded bg-brand-600/80" style={{ width: `${(x.value / max) * 100}%` }} />
          </div>
          <div className="w-10 text-right font-mono text-xs text-slate-600">{x.value}</div>
        </div>
      ))}
      {items.length > 20 ? <div className="text-xs text-slate-500">僅顯示前 20 名。</div> : null}
    </div>
  );
}
