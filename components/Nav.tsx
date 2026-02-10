import Link from "next/link";

const nav = [
  { href: "/", label: "首頁" },
  { href: "/team", label: "團隊" },
  { href: "/play", label: "彩球機" },
  { href: "/analysis", label: "歷史分析" },
] as const;

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-slate-950">
      <div className="container flex items-center justify-between py-3">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-base font-semibold tracking-[0.15em] text-[color:var(--brand)]">
            威勝創投
          </span>
          <span className="hidden text-xs text-slate-300 md:inline">內部互動平台</span>
        </Link>

        <nav className="flex items-center gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-1.5 text-sm text-slate-200 hover:bg-white/10"
            >
              {item.label}
            </Link>
          ))}
          <span className="ml-2 hidden rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-slate-200 md:inline">
            內部使用｜僅供娛樂
          </span>
        </nav>
      </div>
    </header>
  );
}
