// 舊網址自動轉去新網址（301 永久轉址，保留路徑同參數）
export default {
  fetch(request, env) {
    const u = new URL(request.url)
    return Response.redirect((env.NEW_URL || 'https://trails-of-the-past.pages.dev') + u.pathname + u.search, 301)
  },
}
