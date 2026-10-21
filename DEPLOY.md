# 部署去 Cloudflare Workers（workers.dev，免費網域，香港可以直接打開）

## Windows：雙擊 `deploy-windows.bat`
1. 要先裝 Node.js LTS（https://nodejs.org）。
2. 雙擊 `deploy-windows.bat` → 瀏覽器打開 Cloudflare，**你自己登入**並按 Allow → 第一次會叫你改一個 workers.dev 子網域名。
3. 最後可以揀輸入 Gemini API key（只會存喺 Cloudflare，唔會入前端）。
4. 完成後網址：`https://wangri-lvtu-hk.<你嘅子網域>.workers.dev`。
如果帳戶唔接受 `[placement]` 設定，腳本會自動改用 `wrangler.basic.toml`（冇 placement；咁樣喺香港用 AI 可能會被 Gemini 拒絕，遊戲會自動用冇 AI 模式）。

## 手動指令

```bash
npm ci                                  # 安裝依賴（包括 wrangler）
npm run build:cloudflare                # 打包網站到 dist/，前端 AI 指向 /api/ai
npx wrangler login                      # 登入 Cloudflare（或者設定 CLOUDFLARE_API_TOKEN）
npx wrangler secret put GEMINI_API_KEY  # 輸入 Gemini API key（只存喺 Cloudflare）
npx wrangler deploy                     # 部署 Worker + 靜態資產
```
或者一句：`npm run deploy`（= build:cloudflare + wrangler deploy）。

- Worker 名：`wangri-lvtu-hk`（喺 `wrangler.toml` 改）。網址：`https://wangri-lvtu-hk.<帳戶子網域>.workers.dev`
- 結構：`worker/index.js` 處理 `POST /api/ai`；其他路徑由 `[assets]`（`dist/`）提供。
- 已附上預先打包好嘅 `dist/`，可以跳過 build 直接 `npx wrangler deploy`。
- 本機測試 Worker：`npm run build:cloudflare && npx wrangler dev`（要喺 `.dev.vars` 寫 `GEMINI_API_KEY=...`，呢個檔已列入 .gitignore）。
