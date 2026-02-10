export type SuperLottoDraw = {
  date: string;      // YYYY-MM-DD
  period: string;    // 期別（可選）
  zone1: number[];   // 6 numbers 1..38
  zone2: number;     // 1 number 1..8
};

export type PredictMode = "hot" | "cold" | "balanced";

export function drawRandom(): { zone1: number[]; zone2: number } {
  const zone1 = sampleUniqueRange(1, 38, 6).sort((a, b) => a - b);
  const zone2 = randInt(1, 8);
  return { zone1, zone2 };
}

export function analyzeHistory(history: SuperLottoDraw[]) {
  const freq1 = Array.from({ length: 39 }, () => 0);
  const freq2 = Array.from({ length: 9 }, () => 0);

  for (const d of history) {
    for (const n of d.zone1) freq1[n] += 1;
    freq2[d.zone2] += 1;
  }

  const lastSeen1 = Array.from({ length: 39 }, () => -1);
  const lastSeen2 = Array.from({ length: 9 }, () => -1);

  // assume history sorted asc by date
  history.forEach((d, idx) => {
    d.zone1.forEach((n) => (lastSeen1[n] = idx));
    lastSeen2[d.zone2] = idx;
  });

  const latestIndex = history.length - 1;
  const gap1 = lastSeen1.map((idx) => (idx < 0 ? null : latestIndex - idx));
  const gap2 = lastSeen2.map((idx) => (idx < 0 ? null : latestIndex - idx));

  const rank = (arr: number[], from: number, to: number) => {
    const items = [];
    for (let i = from; i <= to; i++) items.push({ n: i, v: arr[i] });
    items.sort((a, b) => b.v - a.v);
    return items;
  };

  const hot1 = rank(freq1, 1, 38).slice(0, 10);
  const cold1 = rank(freq1.map((v) => -v) as any, 1, 38).map((x: any) => ({ n: x.n, v: -x.v })).slice(0, 10);

  const hot2 = rank(freq2, 1, 8).slice(0, 8);
  const cold2 = rank(freq2.map((v) => -v) as any, 1, 8).map((x: any) => ({ n: x.n, v: -x.v })).slice(0, 8);

  const oddEven = { odd: 0, even: 0 };
  const sums: number[] = [];
  for (const d of history) {
    for (const n of d.zone1) (n % 2 === 0 ? oddEven.even++ : oddEven.odd++);
    sums.push(d.zone1.reduce((a, b) => a + b, 0));
  }
  const sumMin = Math.min(...sums);
  const sumMax = Math.max(...sums);
  const sumAvg = sums.reduce((a, b) => a + b, 0) / Math.max(1, sums.length);

  return {
    count: history.length,
    freq1: freq1.slice(1),
    freq2: freq2.slice(1),
    gap1: gap1.slice(1),
    gap2: gap2.slice(1),
    hot1,
    cold1,
    hot2,
    cold2,
    oddEven,
    sumStats: { min: sumMin, max: sumMax, avg: Math.round(sumAvg * 10) / 10 },
    latest: history[history.length - 1] ?? null,
  };
}

export function predict(history: SuperLottoDraw[], mode: PredictMode) {
  const a = analyzeHistory(history);
  const freq1 = a.freq1;
  const gap1 = a.gap1;

  const scores: { n: number; s: number }[] = [];
  for (let n = 1; n <= 38; n++) {
    const f = freq1[n - 1] ?? 0;
    const g = gap1[n - 1] ?? 0;
    let s = 0;
    if (mode === "hot") s = f * 3 + Math.random();
    else if (mode === "cold") s = (g ?? 0) * 2 + Math.random();
    else s = f * 2 + (g ?? 0) * 1 + Math.random();
    scores.push({ n, s });
  }
  scores.sort((x, y) => y.s - x.s);

  let zone1: number[] = [];
  if (mode !== "balanced") {
    zone1 = scores.slice(0, 6).map((x) => x.n).sort((a, b) => a - b);
  } else {
    const buckets = [
      scores.filter((x) => x.n <= 12),
      scores.filter((x) => x.n >= 13 && x.n <= 25),
      scores.filter((x) => x.n >= 26),
    ];
    const pick = (arr: { n: number; s: number }[], k: number) =>
      arr
        .slice(0, 12)
        .sort(() => Math.random() - 0.5)
        .slice(0, k)
        .map((x) => x.n);

    zone1 = [...pick(buckets[0], 2), ...pick(buckets[1], 2), ...pick(buckets[2], 2)]
      .filter((v, i, self) => self.indexOf(v) === i)
      .slice(0, 6)
      .sort((a, b) => a - b);

    if (zone1.length < 6) {
      const rest = scores.map((x) => x.n).filter((n) => !zone1.includes(n));
      zone1 = [...zone1, ...rest.slice(0, 6 - zone1.length)].sort((a, b) => a - b);
    }
  }

  const scores2: { n: number; s: number }[] = [];
  for (let n = 1; n <= 8; n++) {
    const f = a.freq2[n - 1] ?? 0;
    const g = a.gap2[n - 1] ?? 0;
    let s = 0;
    if (mode === "hot") s = f * 3 + Math.random();
    else if (mode === "cold") s = (g ?? 0) * 2 + Math.random();
    else s = f * 2 + (g ?? 0) * 1 + Math.random();
    scores2.push({ n, s });
  }
  scores2.sort((x, y) => y.s - x.s);
  const zone2 = scores2[0]?.n ?? randInt(1, 8);

  return { zone1, zone2, mode, disclaimer: "僅供娛樂：統計/隨機不代表中獎機率提升。" };
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sampleUniqueRange(min: number, max: number, k: number): number[] {
  const pool = Array.from({ length: max - min + 1 }, (_, i) => i + min);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, k);
}
