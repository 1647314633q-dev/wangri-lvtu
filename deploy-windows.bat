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
if errorlevel 1 ( echo 部署失敗，請影低上面嘅訊息。 & pause & exit /b 1 )

echo.
echo 完成！上面 "https://wangri-lvtu.xxxx.workers.dev" 就係網址，任何人（包括香港）都可以直接打開。
echo AI 預設關閉：故事會將長者講過嘅說話按次序排好。想開 AI 請睇 wrangler.toml 入面 AI_ENABLED 嘅說明。
pause
