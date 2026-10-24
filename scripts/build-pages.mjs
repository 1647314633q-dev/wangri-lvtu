// Cloudflare Pages（Advanced mode）：將 worker/ 入面嘅 AI 伺服器程式複製去 dist/_worker.js/
// Pages 會用 dist/_worker.js/index.js 處理 /api/*、/health，其他路徑交返 env.ASSETS（網站檔案）
import { cpSync, mkdirSync, existsSync } from 'node:fs'
if (!existsSync('dist/index.html')) { console.error('先執行 vite build'); process.exit(1) }
mkdirSync('dist/_worker.js', { recursive: true })
cpSync('worker', 'dist/_worker.js', { recursive: true })
console.log('已複製 worker/ → dist/_worker.js/')
