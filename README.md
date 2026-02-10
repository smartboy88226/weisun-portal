# 威勝創投內部互動平台 (Next.js)

內部同仁用：團隊頁 / 威力彩彩球機 / 歷史分析與娛樂預測

## 0) 先安裝 Node.js
請安裝 Node.js LTS（安裝時記得勾選 Add to PATH）。

## 1) 安裝與啟動
```bash
npm i
npm run dev
```
開啟 http://localhost:3000

## 2) 部署（最省事）
建議用 Vercel：把專案推到 GitHub → 匯入 Vercel → 自動部署 → 產生 `*.vercel.app` 連結分享給同事

## 3) 換成真實歷史資料（可選）
1. 從官方下載威力彩歷史資料（CSV）
2. 放到 `scripts/input/superlotto.csv`
3. 執行：
```bash
npm run convert:csv
```
會覆蓋 `data/superlotto.json`

> 若 CSV 欄位名稱不同，請到 `scripts/convert-superlotto-csv.ts` 調整 parseRow() 的欄位 mapping

## Disclaimer
本站所有「預測號碼」為統計/隨機的娛樂展示，不構成任何保證或投注建議。
