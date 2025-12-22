export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const shortCode = url.pathname.substring(1);

  // 如果是根路径或 API 路径，跳过
  if (!shortCode || shortCode.startsWith('api/')) {
    return context.next();
  }

  const data = await env.URL_STORE.get(shortCode);

  if (!data) {
    return context.next();
  }

  const urlData = JSON.parse(data);

  // 更新点击次数
  urlData.clicks = (urlData.clicks || 0) + 1;
  await env.URL_STORE.put(shortCode, JSON.stringify(urlData));

  return Response.redirect(urlData.url, 302);
}
