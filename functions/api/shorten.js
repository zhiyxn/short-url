import { generateShortCode, isValidUrl, corsHeaders } from '../utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { url, customCode } = await request.json();

    if (!url || !isValidUrl(url)) {
      return new Response(JSON.stringify({ error: '无效的 URL' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }

    let shortCode = customCode;

    // 如果提供了自定义短码，检查是否已存在
    if (customCode) {
      const existing = await env.URL_STORE.get(customCode);
      if (existing) {
        return new Response(JSON.stringify({ error: '该短码已被使用' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        });
      }
    } else {
      // 生成随机短码，确保不重复
      let attempts = 0;
      do {
        shortCode = generateShortCode();
        const existing = await env.URL_STORE.get(shortCode);
        if (!existing) break;
        attempts++;
      } while (attempts < 10);

      if (attempts >= 10) {
        return new Response(JSON.stringify({ error: '生成短码失败，请重试' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        });
      }
    }

    // 存储短链接信息
    const data = {
      url,
      shortCode,
      createdAt: new Date().toISOString(),
      clicks: 0,
    };

    await env.URL_STORE.put(shortCode, JSON.stringify(data));

    const domain = new URL(request.url).host;

    return new Response(JSON.stringify({
      success: true,
      shortCode,
      shortUrl: `https://${domain}/${shortCode}`,
      originalUrl: url,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: '请求处理失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: corsHeaders(),
  });
}
