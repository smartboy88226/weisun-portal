import "./globals.css";
import type { Metadata } from "next";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "威勝創投｜內部互動平台",
  description: "團隊介紹、威力彩彩球機、歷史分析（僅供娛樂）",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body>
        <Nav />
        <main className="container py-8">{children}</main>
        <footer className="border-t border-slate-200 bg-white/60">
          <div className="container py-6 text-xs text-slate-600">
            * 本站僅供同事娛樂與統計展示，所有「預測號碼」不構成任何保證或建議。
          </div>
        </footer>
      </body>
    </html>
  );
}
