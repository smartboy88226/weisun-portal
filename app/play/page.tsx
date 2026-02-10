"use client";

import { useRef, useState } from "react";
import { LottoMachine, type DropItem, type MachineTheme } from "@/components/LottoMachine";
import { DrawResult } from "@/components/DrawResult";

function sampleUnique(min: number, max: number, k: number) {
  const arr = Array.from({ length: max - min + 1 }, (_, i) => i + min);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, k);
}

export default function PlayPage() {
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState<"slow" | "normal" | "fast">("normal");

  const [finalZone1, setFinalZone1] = useState<number[] | null>(null);
  const [finalZone2, setFinalZone2] = useState<number | null>(null);

  const [revealing, setRevealing] = useState(false);
  const [revealStep, setRevealStep] = useState(0);

  const [dropQueue, setDropQueue] = useState<DropItem[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [theme, setTheme] = useState<MachineTheme>("industrial");

  const timersRef = useRef<number[]>([]);

  function clearTimers() {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  }

  function start() {
    clearTimers();

    const z1 = sampleUnique(1, 38, 6).sort((a, b) => a - b);
    const z2 = sampleUnique(1, 8, 1)[0];

    setFinalZone1(z1);
    setFinalZone2(z2);

    setRevealStep(0);
    setRevealing(true);
    setDropQueue([]);

    setRunning(true);

    const spinMs = speed === "slow" ? 4200 : speed === "fast" ? 2600 : 3300;
    const stepMs = speed === "slow" ? 720 : speed === "fast" ? 460 : 600;

    timersRef.current.push(
      window.setTimeout(() => {
        setRunning(false);

        // reveal zone1 with chute drops
        for (let i = 1; i <= 6; i++) {
          timersRef.current.push(
            window.setTimeout(() => {
              setRevealStep(i);
              setDropQueue((q) => [...q, { n: z1[i - 1], kind: "zone1" }]);
            }, stepMs * i)
          );
        }

        // zone2 last
        timersRef.current.push(
          window.setTimeout(() => {
            setRevealStep(7);
            setDropQueue((q) => [...q, { n: z2, kind: "zone2" }]);
          }, stepMs * 7 + 250)
        );

        timersRef.current.push(
          window.setTimeout(() => setRevealing(false), stepMs * 7 + 900)
        );
      }, spinMs)
    );
  }

  function clear() {
    clearTimers();
    setRunning(false);
    setRevealing(false);
    setRevealStep(0);
    setFinalZone1(null);
    setFinalZone2(null);
    setDropQueue([]);
  }

  return (
    <div className="space-y-6">
      <div className="card card-pad">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">彩球機</h1>
            <p className="mt-2 text-sm text-slate-700">仿電視開獎流程（僅供娛樂）。</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">速度</span>
              <select
                value={speed}
                onChange={(e) => setSpeed(e.target.value as any)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                disabled={revealing}
              >
                <option value="slow">慢</option>
                <option value="normal">中</option>
                <option value="fast">快</option>
              </select>
            </div>

            <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                disabled={revealing}
              />
              音效
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">外觀</span>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                disabled={revealing}
              >
                <option value="industrial">工業</option>
                <option value="premium">精品</option>
                <option value="cute">可愛</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <LottoMachine
        running={running}
        speed={speed}
        dropQueue={dropQueue}
        soundEnabled={soundEnabled}
        theme={theme}
      />

      <div className="card card-pad">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-900">開獎控制</div>
          <div className="flex gap-2">
            <button onClick={start} disabled={revealing} className="btn-primary disabled:opacity-60">
              {revealing ? "開獎中…" : "開獎"}
            </button>
            <button onClick={clear} disabled={revealing} className="btn-secondary disabled:opacity-60">
              清空
            </button>
          </div>
        </div>

        <div className="mt-4">
          <DrawResult
            finalZone1={finalZone1}
            finalZone2={finalZone2}
            revealing={revealing}
            revealStep={revealStep}
          />
        </div>
      </div>
    </div>
  );
}
