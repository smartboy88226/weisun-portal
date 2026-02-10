import Link from "next/link";

export default function Page() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="card overflow-hidden">
        <div className="hero-img grid gap-6 p-8 md:grid-cols-2 md:p-10">
          <div className="text-white">
            <div className="text-xs tracking-[0.25em] text-white/70">
              WEISUN CAPITAL
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              威勝創投 內部互動平台
            </h1>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={"/play" as any}
                className="rounded-xl bg-[color:var(--brand)] px-4 py-2 text-sm font-semibold text-slate-950 hover:opacity-90"
              >
                彩球機
              </Link>

              <Link
                href={"/analysis" as any}
                className="rounded-xl border border-white/30 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
              >
                歷史統計
              </Link>

              <Link
                href={"/team" as any}
                className="rounded-xl border border-white/30 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
              >
                團隊
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 功能卡片 */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card
          title="團隊"
          desc="成員展示與投影牆"
          href="/team"
        />
        <Card
          title="彩球機"
          desc="仿電視開獎流程的互動動畫"
          href="/play"
        />
        <Card
          title="歷史統計"
          desc="歷年開獎資料與統計排行"
          href="/analysis"
        />
      </section>

      {/* 提示 */}
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <p className="font-medium">提醒</p>
        <p className="mt-1">
          本站為內部同仁娛樂用途，僅供統計與展示，不構成任何投注建議。
        </p>
      </section>
    </div>
  );
}

function Card(props: {
  title: string;
  desc: string;
  href: string;
}) {
  const { title, desc, href } = props;

  return (
    <div className="card card-pad">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-2 text-sm text-slate-700">{desc}</div>

      <Link
        href={href as any}
        className="mt-4 inline-flex text-sm font-semibold text-slate-900 hover:underline"
      >
        前往 →
      </Link>
    </div>
  );
}