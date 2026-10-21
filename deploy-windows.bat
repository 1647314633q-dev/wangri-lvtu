@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title 往日旅途 - 部署去 Cloudflare

echo ==============================================
echo   往日旅途：部署去 Cloudflare 免費網域 workers.dev
echo ==============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo 搵唔到 Node.js。請先去 https://nodejs.org 下載安裝 LTS 版本，裝完再雙擊呢個檔案。
  start https://nodejs.org/
  pause
  exit /b 1
)

echo [1/4] 安裝需要嘅工具（第一次要等一兩分鐘）……
call npm ci
if errorlevel 1 ( echo 安裝失敗，請影低上面嘅訊息。 & pause & exit /b 1 )

echo.
echo [2/4] 登入 Cloudflare：瀏覽器會打開，請你自己登入並按「Allow」。
call npx wrangler whoami | findstr /C:"You are logged in" >nul
if errorlevel 1 call npx wrangler login
if errorlevel 1 ( echo 登入未完成。 & pause & exit /b 1 )

echo.
echo [3/4] 打包網站……
call npm run build:cloudflare
if errorlevel 1 ( echo 打包失敗。 & pause & exit /b 1 )

echo.
echo [4/4] 部署……（第一次可能會問你揀 workers.dev 子網域名稱，輸入一個英文名就得）
call npx wrangler deploy
if errorlevel 1 (
  echo 用美國地區設定部署唔到，改用基本設定再試一次……
  call npx wrangler deploy --config wrangler.basic.toml
  if errorlevel 1 ( echo 部署失敗，請影低上面嘅訊息。 & pause & exit /b 1 )
)

echo.
set /p KEY=要唔要而家設定 Gemini AI 金鑰？（Y = 要，直接按 Enter = 遲啲先）:
if /i "%KEY%"=="Y" (
  echo 請貼上你嘅 Gemini API key，然後按 Enter（畫面唔會顯示，係正常嘅）：
  call npx wrangler secret put GEMINI_API_KEY
)

echo.
echo 完成！上面 "https://wangri-lvtu-hk.xxxx.workers.dev" 就係網址，任何人（包括香港）都可以直接打開。
echo 冇設定 Gemini 金鑰都可以玩，只係故事會改為將長者講過嘅說話按次序排好。
pause
