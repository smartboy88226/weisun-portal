"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Ball = {
  id: number;
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  hue: number;
};

export type DropItem = { n: number; kind: "zone1" | "zone2" };
export type MachineTheme = "industrial" | "premium" | "cute";

type DropBall = {
  n: number;
  kind: "zone1" | "zone2";
  x: number;
  y: number;
  vy: number;
  state: "fall" | "tray";
  trayAt?: number;
  alpha: number;
};

function rand(min: number, max: number) { return Math.random() * (max - min) + min; }
function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)); }

function playClick(enabled: boolean) {
  if (!enabled) return;
  try {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(520, ctx.currentTime);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.055, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.09);
    o.onended = () => ctx.close?.();
  } catch {}
}

function themeTokens(theme: MachineTheme) {
  if (theme === "industrial") {
    return {
      base1: "rgba(2,6,23,0.98)",
      base2: "rgba(15,23,42,0.98)",
      accent: "rgba(245,158,11,0.60)",
      steel1: "rgba(148,163,184,0.28)",
      steel2: "rgba(148,163,184,0.10)",
      glassHi: "rgba(255,255,255,0.92)",
      glassLo: "rgba(185,210,255,0.30)",
      shadow: "rgba(2,6,23,0.22)",
      trayGlow: "rgba(16,185,129,0.08)",
      domeGlow: "rgba(96,165,250,0.10)",
    };
  }
  if (theme === "cute") {
    return {
      base1: "rgba(255,59,59,0.95)",
      base2: "rgba(255,138,0,0.95)",
      accent: "rgba(255,255,255,0.26)",
      steel1: "rgba(14,165,233,0.22)",
      steel2: "rgba(236,72,153,0.14)",
      glassHi: "rgba(255,255,255,0.94)",
      glassLo: "rgba(207,231,255,0.44)",
      shadow: "rgba(2,6,23,0.16)",
      trayGlow: "rgba(255,255,255,0.18)",
      domeGlow: "rgba(236,72,153,0.10)",
    };
  }
  // premium
  return {
    base1: "rgba(15,23,42,0.98)",
    base2: "rgba(2,6,23,0.98)",
    accent: "rgba(255,255,255,0.14)",
    steel1: "rgba(226,232,240,0.18)",
    steel2: "rgba(148,163,184,0.10)",
    glassHi: "rgba(255,255,255,0.94)",
    glassLo: "rgba(210,230,255,0.28)",
    shadow: "rgba(2,6,23,0.20)",
    trayGlow: "rgba(59,130,246,0.08)",
    domeGlow: "rgba(255,255,255,0.10)",
  };
}

export function LottoMachine({
  running,
  speed = "normal",
  dropQueue = [],
  soundEnabled = true,
  theme = "industrial",
}: {
  running: boolean;
  speed?: "slow" | "normal" | "fast";
  dropQueue?: DropItem[];
  soundEnabled?: boolean;
  theme?: MachineTheme;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const ballsRef = useRef<Ball[]>([]);
  const dropsRef = useRef<DropBall[]>([]);
  const tRef = useRef<number>(0);
  const [size, setSize] = useState({ w: 980, h: 520 });

  const speedMul = useMemo(() => (speed === "slow" ? 0.78 : speed === "fast" ? 1.25 : 1.0), [speed]);
  const tokens = useMemo(() => themeTokens(theme), [theme]);

  useEffect(() => {
    const parent = canvasRef.current?.parentElement;
    if (!parent) return;
    const resize = () => {
      const w = parent.clientWidth;
      const h = clamp(Math.round(w * 0.56), 420, 620);
      setSize({ w, h });
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const balls: Ball[] = [];
    const count = 40;
    for (let i = 0; i < count; i++) {
      balls.push({
        id: i,
        x: rand(0.38, 0.62),
        y: rand(0.26, 0.56),
        vx: rand(-0.22, 0.22),
        vy: rand(-0.20, 0.20),
        r: rand(0.020, 0.026),
        hue: rand(195, 335),
      });
    }
    ballsRef.current = balls;
  }, []);

  const lastDropLenRef = useRef(0);
  useEffect(() => {
    const len = dropQueue?.length ?? 0;
    if (len <= lastDropLenRef.current) return;
    const newItems = dropQueue.slice(lastDropLenRef.current);
    lastDropLenRef.current = len;

    const startX = 0.80;
    const startY = 0.49;
    newItems.forEach((item, i) => {
      window.setTimeout(() => {
        dropsRef.current.push({
          n: item.n,
          kind: item.kind,
          x: startX,
          y: startY,
          vy: 0.20,
          state: "fall",
          alpha: 1,
        });
        playClick(soundEnabled);
      }, i * 220);
    });
  }, [dropQueue, soundEnabled]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = devicePixelRatio || 1;
    canvas.width = Math.floor(size.w * dpr);
    canvas.height = Math.floor(size.h * dpr);
    canvas.style.width = `${size.w}px`;
    canvas.style.height = `${size.h}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const loop = (ts: number) => {
      if (!tRef.current) tRef.current = ts;
      const dt = clamp((ts - tRef.current) / 1000, 0, 0.033);
      tRef.current = ts;

      ctx.clearRect(0, 0, size.w, size.h);

      const cx = size.w * 0.50;
      const cy = size.h * 0.29;
      const R = Math.min(size.w, size.h) * 0.25;

      const targetEnergy = running ? 1.0 : 0.0;
      const energy = clamp((loop as any).energy ?? 0, 0, 1);
      const newEnergy = energy + (targetEnergy - energy) * (running ? 0.10 : 0.06);
      (loop as any).energy = newEnergy;

      drawDome(ctx, cx, cy, R, tokens);

      // inside clip
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R - 4, 0, Math.PI * 2);
      ctx.clip();

      const bg = ctx.createRadialGradient(cx, cy - R * 0.55, R * 0.15, cx, cy, R);
      bg.addColorStop(0, tokens.glassHi);
      bg.addColorStop(1, tokens.glassLo);
      ctx.fillStyle = bg;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

      const balls = ballsRef.current;
      for (const b of balls) {
        if (newEnergy > 0.02) {
          const dx = (b.x - 0.5);
          const dy = (b.y - 0.29);
          const fx = -dy * 1.2;
          const fy = dx * 1.2;
          b.vx += fx * 1.6 * dt * newEnergy * speedMul;
          b.vy += fy * 1.6 * dt * newEnergy * speedMul;
          b.vx += Math.sin(ts / 240 + b.id) * 0.03 * dt * newEnergy;
          b.vy += Math.cos(ts / 260 + b.id) * 0.03 * dt * newEnergy;
        }
        const fric = running ? 0.995 : 0.976;
        b.vx *= Math.pow(fric, 60 * dt);
        b.vy *= Math.pow(fric, 60 * dt);

        const cap = 1.6 * speedMul * (0.25 + newEnergy);
        b.vx = clamp(b.vx, -cap, cap);
        b.vy = clamp(b.vy, -cap, cap);

        b.x += b.vx * dt;
        b.y += b.vy * dt;

        const px = (b.x - 0.5) * R;
        const py = (b.y - 0.29) * R;
        const pr = b.r * R;
        const dist = Math.hypot(px, py);
        const maxDist = (R - 8) - pr;
        if (dist > maxDist && dist > 0) {
          const nx = px / dist;
          const ny = py / dist;
          const push = dist - maxDist;
          b.x -= (nx * push) / R;
          b.y -= (ny * push) / R;
          const vnx = b.vx * nx + b.vy * ny;
          b.vx -= 2.0 * vnx * nx;
          b.vy -= 2.0 * vnx * ny;
        }
      }

      for (const b of balls) {
        const x = cx + (b.x - 0.5) * R;
        const y = cy + (b.y - 0.29) * R;
        const rr = b.r * R;
        drawCandyBall(ctx, x, y, rr, b.hue, "mix", 0.95);
      }

      // reflections
      const gloss = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.45, R * 0.10, cx - R * 0.10, cy - R * 0.20, R * 0.95);
      gloss.addColorStop(0, "rgba(255,255,255,0.46)");
      gloss.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gloss;
      ctx.beginPath();
      ctx.ellipse(cx - R * 0.10, cy - R * 0.12, R * 0.70, R * 0.50, -0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore(); // clip end

      drawBase(ctx, size.w, size.h, tokens, theme);
      drawChute(ctx, size.w, size.h, running, tokens);
      drawTray(ctx, size.w, size.h, tokens, theme);

      const gravity = 2.1 * (speed === "fast" ? 1.25 : speed === "slow" ? 0.9 : 1.0);
      for (let i = dropsRef.current.length - 1; i >= 0; i--) {
        const d = dropsRef.current[i];

        if (d.state === "fall") {
          d.vy += gravity * dt;
          d.y += d.vy * dt;
          if (d.y > 0.78) {
            d.state = "tray";
            d.y = 0.78;
            d.vy = 0;
            d.trayAt = ts;
            playClick(soundEnabled);
          }
        } else {
          const held = d.trayAt ? (ts - d.trayAt) : 0;
          if (held > 500) d.alpha -= dt * 2.2;
          if (d.alpha <= 0) {
            dropsRef.current.splice(i, 1);
            continue;
          }
        }

        const x = size.w * d.x;
        const y = size.h * d.y;
        const rr = Math.min(size.w, size.h) * 0.018;
        drawCandyBall(ctx, x, y, rr, 0, d.kind, d.alpha);
        drawNumber(ctx, x, y, rr, d.n, d.alpha);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      tRef.current = 0;
    };
  }, [running, size.w, size.h, speedMul, speed, soundEnabled, tokens, theme]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex justify-center">
        <div className="relative" style={{ width: size.w, height: size.h }}>
          <canvas ref={canvasRef} className="absolute inset-0" />
        </div>
      </div>
    </div>
  );
}

type Tokens = ReturnType<typeof themeTokens>;

function drawDome(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, t: Tokens) {
  ctx.save();
  ctx.shadowColor = t.shadow;
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 10;

  const ring = ctx.createRadialGradient(cx, cy - R * 0.55, R * 0.18, cx, cy, R);
  ring.addColorStop(0, t.glassHi);
  ring.addColorStop(0.6, t.glassLo);
  ring.addColorStop(1, "rgba(15,23,42,0.10)");

  ctx.fillStyle = ring;
  ctx.beginPath();
  ctx.arc(cx, cy, R + 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.strokeStyle = "rgba(15,23,42,0.12)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, R + 6, 0, Math.PI * 2);
  ctx.stroke();

  // soft glow
  ctx.fillStyle = t.domeGlow;
  ctx.beginPath();
  ctx.arc(cx, cy, R + 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawBase(ctx: CanvasRenderingContext2D, w: number, h: number, t: Tokens, theme: MachineTheme) {
  ctx.save();
  ctx.shadowColor = t.shadow;
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 12;

  if (theme === "cute") {
    // rounded cute base
    const x = w * 0.18;
    const y = h * 0.56;
    const ww = w * 0.64;
    const hh = h * 0.34;
    const g = ctx.createLinearGradient(x, y, x + ww, y + hh);
    g.addColorStop(0, t.base1);
    g.addColorStop(1, t.base2);
    ctx.fillStyle = g;
    roundRect(ctx, x, y, ww, hh, 34);
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.fillStyle = t.accent;
    roundRect(ctx, x + ww * 0.18, y + hh * 0.10, ww * 0.64, 8, 8);
    ctx.fill();
  } else {
    // industrial/premium base
    const x = w * 0.18;
    const y = h * 0.56;
    const ww = w * 0.64;
    const hh = h * 0.34;
    const g = ctx.createLinearGradient(x, y, x + ww, y + hh);
    g.addColorStop(0, t.base1);
    g.addColorStop(1, t.base2);
    ctx.fillStyle = g;
    roundRect(ctx, x, y, ww, hh, theme === "industrial" ? 22 : 28);
    ctx.fill();
    ctx.shadowColor = "transparent";

    // accent line
    const bar = ctx.createLinearGradient(x, y, x + ww, y);
    bar.addColorStop(0, "rgba(245,158,11,0.0)");
    bar.addColorStop(0.5, t.accent);
    bar.addColorStop(1, "rgba(245,158,11,0.0)");
    ctx.fillStyle = bar;
    roundRect(ctx, x + ww * 0.12, y + hh * 0.10, ww * 0.76, 5, 5);
    ctx.fill();
  }
  ctx.restore();
}

function drawChute(ctx: CanvasRenderingContext2D, w: number, h: number, running: boolean, t: Tokens) {
  const x = w * 0.76;
  const y = h * 0.44;
  const ww = w * 0.14;
  const hh = h * 0.22;

  ctx.save();
  const g = ctx.createLinearGradient(x, y, x + ww, y + hh);
  g.addColorStop(0, t.steel1);
  g.addColorStop(1, t.steel2);
  ctx.fillStyle = g;
  roundRect(ctx, x, y, ww, hh, 18);
  ctx.fill();

  ctx.strokeStyle = "rgba(15,23,42,0.10)";
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, ww, hh, 18);
  ctx.stroke();

  // status dot
  ctx.fillStyle = running ? "rgba(16,185,129,0.85)" : "rgba(148,163,184,0.8)";
  ctx.beginPath();
  ctx.arc(w * 0.20, h * 0.12, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawTray(ctx: CanvasRenderingContext2D, w: number, h: number, t: Tokens, theme: MachineTheme) {
  const x = w * 0.72;
  const y = h * 0.76;
  const ww = w * 0.20;
  const hh = h * 0.11;

  ctx.save();
  const g = ctx.createLinearGradient(x, y, x + ww, y + hh);
  g.addColorStop(0, t.steel1);
  g.addColorStop(1, t.steel2);
  ctx.fillStyle = g;
  roundRect(ctx, x, y, ww, hh, theme === "industrial" ? 16 : 18);
  ctx.fill();

  ctx.strokeStyle = "rgba(15,23,42,0.10)";
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, ww, hh, theme === "industrial" ? 16 : 18);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.20)";
  roundRect(ctx, x + 10, y + 10, ww - 20, hh * 0.35, 14);
  ctx.fill();

  // subtle glow
  ctx.fillStyle = t.trayGlow;
  roundRect(ctx, x - 6, y - 6, ww + 12, hh + 12, 20);
  ctx.fill();

  ctx.restore();
}

function drawCandyBall(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  r: number,
  hue: number,
  kind: "mix" | "zone1" | "zone2",
  alpha: number = 1
) {
  ctx.save();
  ctx.globalAlpha = alpha;

  let h1 = hue, h2 = (hue + 35) % 360;
  if (kind === "zone1") { h1 = 215; h2 = 230; }
  if (kind === "zone2") { h1 = 44; h2 = 52; }

  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.2, x, y, r);
  g.addColorStop(0, "rgba(255,255,255,0.98)");
  g.addColorStop(0.25, `hsla(${h1}, 92%, 60%, 0.95)`);
  g.addColorStop(1, `hsla(${h2}, 88%, 42%, 0.95)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(2,6,23,0.12)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.beginPath();
  ctx.arc(x - r * 0.22, y - r * 0.28, r * 0.34, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawNumber(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, n: number, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = `800 ${Math.max(10, Math.floor(r*0.95))}px ui-sans-serif, system-ui`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(n).padStart(2, "0"), x, y + 0.5);
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
