# 部署去 Cloudflare Pages（trails-of-the-past.pages.dev，免費網域，香港可以直接打開）

## 推薦：連 GitHub 自動部署（Cloudflare Pages）
1. Cloudflare → Workers & Pages → Create → Pages → Connect to Git → 揀 repo `wangri-lvtu`
2. Project name：`trails-of-the-past`；Production branch：`main`；Framework preset：None
3. Build command：`npm run build:pages`；Build output directory：`dist`
4. Save and Deploy。之後推上 `main` 就自動更新；其他分支會有預覽網址。
5. AI：`wrangler.toml` 已設定免費 Workers AI（唔使金鑰）。想用 Gemini／DeepSeek，喺 Pages 專案 Settings → Variables and Secrets 加 Secret `GEMINI_API_KEY`／`DEEPSEEK_API_KEY`。

## 舊網址轉去新網址
`redirect/` 係舊 Worker（wangri-lvtu-hk.visionlink-workspace.workers.dev）嘅轉址程式：
喺 Cloudflare 舊 Worker → Settings → Build，將 Deploy command 改成 `npx wrangler deploy -c redirect/wrangler.toml`，Build command 留空，然後重新部署。
舊連結、二維碼會自動轉去新網址（保留路徑）。

## Windows：雙擊 `deploy-windows.bat`（唔用 GitHub 自動部署時）
會打包同用 `wrangler pages deploy` 部署。

## 注意
- 遊戲紀錄存喺每部裝置嘅瀏覽器，按網址分開；換網址之後，舊網址嘅紀錄唔會自動出現，請先「下載自傳文字檔」留底。
- 測試：`npm test`；本機試 Pages：`npm run build:pages && npx wrangler pages dev dist`
