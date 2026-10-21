# 搬離 Claude Artifact 平台：依賴清單

呢個專案原本喺 claude.ai Artifact 入面試玩。以下係所有同 Claude 平台有關嘅地方，同埋搬去 Cloudflare Workers 之後點處理。

| # | 功能 | 位置 | 喺 Claude Artifact 入面 | 搬出之後 | 需要做咩 |
|---|---|---|---|---|---|
| 1 | AI：整理自傳 | `src/lib/ai.js` → `generateStory()` | `window.claude.use('sample')` 呼叫 Claude | `window.claude` 唔存在，自動改用 `POST /api/ai`（`worker/index.js` → Google Gemini） | 喺 Cloudflare 設定 Secret `GEMINI_API_KEY` |
| 2 | AI：按學校類型調整回憶卡問題 | `src/lib/ai.js` → `personalizeQuestion()` | 同上（`sample.json`） | 同上，`/api/ai` 用 `json: true` | 同上 |
| 3 | AI：路線 B 離校訪談 | `src/lib/ai.js` → `nextInterviewStep()` | 同上（`sample.json`） | 同上 | 同上 |
| 4 | Artifact 頁面外殼 | 已發佈嘅 `wangri-lvtu.html` 係「頁面片段」，由 claude.ai 自動包上 `<html><head><body>` | — | 唔再用。改用 Vite 產生嘅完整 `dist/index.html` | 無 |

**冇用到** 嘅 Claude 平台功能：Artifact 資料庫（db）、共享狀態（room）、檔案上載（assets）、登入身份（user）、MCP 連接器、下載（downloads）。

## 本身已經同平台無關、搬出後照用嘅功能

| 功能 | 位置 | 說明 |
|---|---|---|
| 遊戲紀錄儲存 | `src/lib/storage.js` | 瀏覽器 `localStorage`，鍵名 `wangri-lvtu-v1`。只存喺每部裝置，唔會上傳。claude.ai 同 workers.dev 係唔同網域，**舊紀錄唔會跟住搬過去**。 |
| 廣東話語音輸入 | `src/lib/speech.js` | 瀏覽器 Web Speech API（`yue-Hant-HK`）。喺 Claude Artifact 入面用唔到咪；喺 workers.dev 用 Chrome／Edge 就得（要用 HTTPS，workers.dev 已係 HTTPS）。 |
| 廣東話朗讀 | `src/lib/speech.js` | 瀏覽器 `speechSynthesis`（`zh-HK`），視乎裝置有冇裝香港中文語音。 |
| 字型 | `index.html` | Google Fonts（Noto Sans TC / Noto Serif TC），載入唔到會用系統字型。 |
| 圖片 | `src/assets/images/` | 全部隨專案打包，冇外部圖片連結。 |
| 動畫、配對連線、回憶卡 | `src/styles.css`、`src/components/` | 純 CSS／React，冇平台依賴。 |

## 程式碼仲保留咗嘅 Claude 相容碼
`src/lib/ai.js` 嘅 `getSampler()` 會先檢查 `window.claude`；喺 workers.dev 佢一定係 `undefined`，所以會直接跳去 `/api/ai`。保留佢唔影響運作，亦方便日後喺 claude.ai 再試玩。想刪都可以：刪走 `getSampler()` 同所有 `sampler` 分支即可。

## API 金鑰
- 前端**冇**任何金鑰。瀏覽器只會呼叫同網域嘅 `/api/ai`。
- `GEMINI_API_KEY` 用 `npx wrangler secret put GEMINI_API_KEY` 存喺 Cloudflare，只有 Worker 讀到。
- `wrangler.toml` 只有非機密設定（`GEMINI_MODEL`）。

## 已知限制
- Google 唔接受由香港 IP 呼叫 Gemini API。`wrangler.toml` 用 `[placement] region = "gcp:us-central1"` 叫 Cloudflare 喺美國執行 Worker。部署後要喺香港實測「整理我的故事」；如果唔得，Worker Logs 會見到 `User location is not supported`，可以改用 Google Cloud Vertex AI。
- 冇設定 `GEMINI_API_KEY` 或者 AI 出錯時，遊戲唔會卡住：自傳會改為將長者原話按次序排好，畫面註明「未連接 AI」；回憶卡同訪談會用預設問題。
