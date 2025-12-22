/**
 * 短链接服务 - Cloudflare Workers
 */

// 生成随机短码
function generateShortCode(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 验证 URL 格式
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// 处理 CORS
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// 创建短链接
async function createShortUrl(request, env) {
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

    return new Response(JSON.stringify({
      success: true,
      shortCode,
      shortUrl: `https://${env.DOMAIN || 'your-domain.com'}/${shortCode}`,
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

// 重定向到原始 URL
async function redirectToUrl(shortCode, env) {
  const data = await env.URL_STORE.get(shortCode);

  if (!data) {
    return new Response('短链接不存在', { status: 404 });
  }

  const urlData = JSON.parse(data);

  // 更新点击次数
  urlData.clicks = (urlData.clicks || 0) + 1;
  await env.URL_STORE.put(shortCode, JSON.stringify(urlData));

  return Response.redirect(urlData.url, 302);
}

// 获取短链接信息
async function getUrlInfo(shortCode, env) {
  const data = await env.URL_STORE.get(shortCode);

  if (!data) {
    return new Response(JSON.stringify({ error: '短链接不存在' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  return new Response(data, {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

// 删除短链接
async function deleteUrl(shortCode, env) {
  const data = await env.URL_STORE.get(shortCode);

  if (!data) {
    return new Response(JSON.stringify({ error: '短链接不存在' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  await env.URL_STORE.delete(shortCode);

  return new Response(JSON.stringify({ success: true, message: '短链接已删除' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

// 主处理函数
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(),
      });
    }

    // API 路由
    if (path.startsWith('/api/')) {
      // 创建短链接
      if (path === '/api/shorten' && request.method === 'POST') {
        return createShortUrl(request, env);
      }

      // 获取短链接信息
      if (path.startsWith('/api/info/') && request.method === 'GET') {
        const shortCode = path.split('/api/info/')[1];
        return getUrlInfo(shortCode, env);
      }

      // 删除短链接
      if (path.startsWith('/api/') && request.method === 'DELETE') {
        const shortCode = path.split('/api/')[1];
        return deleteUrl(shortCode, env);
      }

      return new Response(JSON.stringify({ error: 'API 路由不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }

    // 根路径返回简单的使用说明
    if (path === '/') {
      return new Response(`
        <html>
          <head>
            <title>短链接服务</title>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
              h1 { color: #333; }
              code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
              pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
            </style>
          </head>
          <body>
            <h1>短链接服务 API</h1>
            <h2>使用说明</h2>

            <h3>1. 创建短链接</h3>
            <pre>POST /api/shorten
Content-Type: application/json

{
  "url": "https://example.com/very/long/url",
  "customCode": "mycode" // 可选，自定义短码
}</pre>

            <h3>2. 访问短链接</h3>
            <pre>GET /{shortCode}</pre>

            <h3>3. 获取短链接信息</h3>
            <pre>GET /api/info/{shortCode}</pre>

            <h3>4. 删除短链接</h3>
            <pre>DELETE /api/{shortCode}</pre>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // 短链接重定向
    const shortCode = path.substring(1);
    if (shortCode) {
      return redirectToUrl(shortCode, env);
    }

    return new Response('Not Found', { status: 404 });
  },
};
