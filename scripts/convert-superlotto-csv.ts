/**
 * 把官方 CSV 轉成 data/superlotto.json
 *
 * 使用方式：
 * 1) 將 CSV 放入 scripts/input/superlotto.csv
 * 2) npm run convert:csv
 *
 * 注意：不同來源 CSV 欄位名稱可能不同，你可在 parseRow() 內調整欄位 mapping。
 */
import fs from "node:fs";
import path from "node:path";

type Draw = { date: string; period: string; zone1: number[]; zone2: number };

const inputPath = path.join(process.cwd(), "scripts", "input", "superlotto.csv");
const outPath = path.join(process.cwd(), "data", "superlotto.json");

function parseCSV(text: string) {
  const lines = text.replace(/\r/g, "").split("\n").filter(Boolean);
  const header = splitCSVLine(lines[0] ?? "");
  const rows = lines.slice(1).map((line) => {
    const cols = splitCSVLine(line);
    const obj: Record<string, string> = {};
    header.forEach((h, i) => (obj[h.trim()] = (cols[i] ?? "").trim()));
    return obj;
  });
  return rows;
}

function splitCSVLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === "," && !inQ) { out.push(cur); cur = ""; continue; }
    cur += ch;
  }
  out.push(cur);
  return out;
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function parseRow(r: Record<string, string>): Draw | null {
  const period = r["期別"] || r["期號"] || r["DrawNo"] || "";
  const dateRaw = r["開獎日期"] || r["日期"] || r["DrawDate"] || "";
  if (!dateRaw) return null;

  const m = dateRaw.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (!m) return null;
  const date = `${m[1]}-${pad2(Number(m[2]))}-${pad2(Number(m[3]))}`;

  const z: number[] = [];
  for (let i = 1; i <= 6; i++) {
    const v = r[`獎號${i}`] || r[`No${i}`] || "";
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    z.push(n);
  }
  const zone2 = Number(r["第二區"] || r["特別號"] || r["SpecialNo"] || "");
  if (!Number.isFinite(zone2)) return null;

  return { date, period: String(period), zone1: z.sort((a, b) => a - b), zone2 };
}

function main() {
  if (!fs.existsSync(inputPath)) {
    console.error("找不到輸入檔：", inputPath);
    process.exit(1);
  }
  const text = fs.readFileSync(inputPath, "utf-8");
  const rows = parseCSV(text);
  const draws: Draw[] = [];
  for (const r of rows) {
    const d = parseRow(r);
    if (d) draws.push(d);
  }
  draws.sort((a, b) => a.date.localeCompare(b.date));
  fs.writeFileSync(outPath, JSON.stringify(draws, null, 2), "utf-8");
  console.log(`✅ 轉換完成：${draws.length} 筆 → ${path.relative(process.cwd(), outPath)}`);
}

main();
