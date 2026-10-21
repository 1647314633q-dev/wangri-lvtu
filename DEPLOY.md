# 部署去 Cloudflare Workers（workers.dev，免費網域，香港可以直接打開）

## Windows：雙擊 `deploy-windows.bat`
1. 要先裝 Node.js LTS（https://nodejs.org）。
2. 雙擊 `deploy-windows.bat` → 瀏覽器打開 Cloudflare，**你自己登入**並按 Allow → 第一次會叫你改一個 workers.dev 子網域名。
3. AI 預設關閉，遊戲照常玩得；要開 AI 見下面。
4. 完成後網址：`https://wangri-lvtu.<你嘅子網域>.workers.dev`。
AI 預設關閉（`wrangler.toml` 嘅 `AI_ENABLED = "false"`）。要開：先 `npx wrangler secret put GEMINI_API_KEY`，再將 `AI_ENABLED` 改做 `"true"` 重新部署。
狀態檢查：`/health` 會回應 `ai: "gemini"` 或 `"local"`。測試：`npm test`。

## 手動指令

```bash
npm ci                                  # 安裝依賴（包括 wrangler）
npm run build:cloudflare                # 打包網站到 dist/，前端 AI 指向 /api/ai
npx wrangler login                      # 登入 Cloudflare（或者設定 CLOUDFLARE_API_TOKEN）
npx wrangler secret put GEMINI_API_KEY  # 輸入 Gemini API key（只存喺 Cloudflare）
npx wrangler deploy                     # 部署 Worker + 靜態資產
```
或者一句：`npm run deploy`（= build:cloudflare + wrangler deploy）。

- Worker 名：`wangri-lvtu`（喺 `wrangler.toml` 改）。網址：`https://wangri-lvtu.<帳戶子網域>.workers.dev`
- 結構：`worker/index.js` 處理 `POST /api/ai`；其他路徑由 `[assets]`（`dist/`）提供。
- 已附上預先打包好嘅 `dist/`，可以跳過 build 直接 `npx wrangler deploy`。
- 本機測試 Worker：`npm run build:cloudflare && npx wrangler dev`（要喺 `.dev.vars` 寫 `GEMINI_API_KEY=...`，呢個檔已列入 .gitignore）。
