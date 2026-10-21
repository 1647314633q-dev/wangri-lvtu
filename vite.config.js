import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `npm run build`         → 一般網站版本（dist/，圖片為獨立檔案）
// `npm run build:single`  → 單一 HTML 檔案（dist-single/index.html，圖片已內嵌，方便直接開啟或分享）
export default defineConfig(({ mode }) => mode === 'single'
  ? { plugins: [react(), viteSingleFile()], build: { outDir: 'dist-single', assetsInlineLimit: 100000000 } }
  : { plugins: [react()], base: './', define: mode === 'cloudflare' ? { 'import.meta.env.VITE_AI_ENDPOINT': JSON.stringify('/api/ai') } : {} })
