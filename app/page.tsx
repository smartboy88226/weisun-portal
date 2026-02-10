import Link from "next/link";

export default function Page() {
  return (
    <div className="space-y-8">
      <section className="card overflow-hidden">
        <div className="hero-img grid gap-6 p-8 md:grid-cols-2 md:p-10">
          <div className="text-white">
            <div className="text-xs tracking-[0.25em] text-white/70">WEISUN CAPITAL</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">威勝創投 內部互動平台</h1>
<div className="mt-6 flex flex-wrap gap-3">
              <Link
                className="rounded-xl bg-[color:var(--brand)] px-4 py-2 text-sm font-semibold text-slate-950 hover:opacity-90"
                href="/play"
              >
                彩球機
              </Link>
              <Link
                className="rounded-xl border border-white/30 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                href="/analysis"
              >
                歷史統計
              </Link>
              <Link
                className="rounded-xl border border-white/30 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                href="/team"
              >
                團隊
              </Link>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="h-full rounded-2xl border border-white/15 bg-black/15 p-6 text-white/90">
              <div className="text-sm font-semibold">提示</div>
              <div className="mt-2 text-sm text-white/75">本網站內容僅供內部同仁休閒互動。</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card title="團隊" desc="成員展示與投影背景。" href="/team" />
        <Card title="彩球機" desc="仿電視開獎流程的互動畫面。" href="/play" />
        <Card title="歷史統計" desc="匯入歷年開獎資料，查看統計排行。" href="/analysis" />
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <p className="font-medium">提醒</p>
        <p className="mt-1">本站為內部同仁娛樂用途；統計與展示不構成任何投注建議。</p>
      </section>
    </div>
  );
}

function Card({ title, desc, href }: { title: string; desc: string; href: string }) {
  return (
    <div className="card card-pad">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-2 text-sm text-slate-700">{desc}</div>
      <Link className="mt-4 inline-flex text-sm font-semibold text-slate-900 hover:underline" href={href}>
        前往 →
      </Link>
    </div>
  );
}
