"use client";

import { useEffect, useMemo, useState } from "react";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function DrawResult({
  finalZone1,
  finalZone2,
  revealing,
  revealStep,
}: {
  finalZone1: number[] | null;
  finalZone2: number | null;
  revealing: boolean;
  revealStep: number; // 0..7 (6 balls + 1 special)
}) {
  const zone1Slots = useMemo(() => Array.from({ length: 6 }, (_, i) => i), []);
  const zone2Slot = 0;

  const shownZone1 = useMemo(() => {
    if (!finalZone1) return Array(6).fill(null) as Array<number | null>;
    return zone1Slots.map((i) => (i < revealStep ? finalZone1[i] : null));
  }, [finalZone1, revealStep, zone1Slots]);

  const shownZone2 = useMemo(() => {
    if (!finalZone2) return null;
    return revealStep >= 7 ? finalZone2 : null;
  }, [finalZone2, revealStep]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">本次結果</div>
          <div className="mt-1 text-xs text-slate-500">
            {revealing ? "開獎中：號碼將依序開出（電視風）" : "按「開獎」開始。抽完會覆蓋上一組結果。"}
          </div>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
          <span className={"h-2 w-2 rounded-full " + (revealing ? "bg-emerald-500" : "bg-slate-300")} />
          {revealing ? "LIVE 開獎中" : "待命"}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          {shownZone1.map((n, idx) => (
            <Ball key={idx} n={n} kind="zone1" popping={revealing && n !== null && idx === revealStep - 1} />
          ))}
        </div>

        <div className="mx-1 text-sm font-semibold text-slate-500">+</div>

        <Ball n={shownZone2} kind="zone2" popping={revealing && revealStep === 7 && shownZone2 !== null} />
      </div>

      {finalZone1 && finalZone2 && revealStep >= 7 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-slate-500">
            結果：{finalZone1.map(pad2).join(" ")} + {pad2(finalZone2)}
          </div>
          <button
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
            onClick={() => {
              const txt = `${finalZone1.map(pad2).join(" ")} + ${pad2(finalZone2)}`;
              navigator.clipboard?.writeText(txt);
            }}
          >
            複製結果
          </button>
        </div>
      )}
    </div>
  );
}

function Ball({
  n,
  kind,
  popping,
}: {
  n: number | null;
  kind: "zone1" | "zone2";
  popping?: boolean;
}) {
  const base =
    kind === "zone1"
      ? "bg-blue-600 text-white"
      : "bg-amber-400 text-slate-950";

  const empty = "bg-white text-slate-300 border border-dashed border-slate-300";

  return (
    <div
      className={
        "relative flex h-12 w-12 items-center justify-center rounded-full text-sm font-extrabold shadow-sm " +
        (n === null ? empty : base) +
        (popping ? " animate-bounce" : "")
      }
      aria-label={n === null ? "尚未開出" : String(n)}
    >
      {n === null ? "—" : String(n).padStart(2, "0")}
      <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-black/5" />
    </div>
  );
}
