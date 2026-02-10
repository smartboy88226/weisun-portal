"use client";

export function Ball({ n, variant = "zone1" }: { n: number; variant?: "zone1" | "zone2" }) {
  const base =
    "inline-flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold shadow-sm select-none";
  const cls =
    variant === "zone2" ? base + " bg-amber-400 text-amber-950" : base + " bg-brand-600 text-white";
  return <div className={cls}>{n.toString().padStart(2, "0")}</div>;
}

export function BallRow({ zone1, zone2 }: { zone1: number[]; zone2: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {zone1.map((n) => (
        <Ball key={n} n={n} variant="zone1" />
      ))}
      <span className="mx-1 text-sm text-slate-500">+</span>
      <Ball n={zone2} variant="zone2" />
    </div>
  );
}
