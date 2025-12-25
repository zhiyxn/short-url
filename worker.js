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
function parseAllowedOrigins(env) {
  const raw = (env.ALLOWED_ORIGINS || '').trim();
  if (!raw) return null;
  const items = raw.split(',').map((item) => item.trim()).filter(Boolean);
  if (items.includes('*')) return null;
  return items.length > 0 ? items : null;
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  const allowedOrigins = parseAllowedOrigins(env);
  const allowOrigin = allowedOrigins
    ? (origin && allowedOrigins.includes(origin) ? origin : 'null')
    : '*';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    ...(allowedOrigins ? { Vary: 'Origin' } : {}),
  };
}

// 创建短链接
async function createShortUrl(request, env) {
  try {
    const { url, customCode, username } = await request.json();

    if (!url || !isValidUrl(url)) {
      return new Response(JSON.stringify({ error: '无效的 URL' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(request, env) },
      });
    }

    let shortCode = customCode;

    // 如果提供了自定义短码，检查是否已存在
    if (customCode) {
      const existing = await env.URL_STORE.get(customCode);
      if (existing) {
        return new Response(JSON.stringify({ error: '该短码已被使用' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json', ...corsHeaders(request, env) },
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
          headers: { 'Content-Type': 'application/json', ...corsHeaders(request, env) },
        });
      }
    }

    // 存储短链接信息
    const data = {
      url,
      shortCode,
      username: username || '',
      createdAt: new Date().toISOString(),
      clicks: 0,
    };

    await env.URL_STORE.put(shortCode, JSON.stringify(data));

    return new Response(JSON.stringify({
      success: true,
      shortCode,
      shortUrl: `https://${env.DOMAIN || 'your-domain.com'}/${shortCode}`,
      originalUrl: url,
      username: username || '',
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(request, env) },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: '请求处理失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(request, env) },
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

// 删除短链接
async function deleteUrl(request, shortCode, env) {
  const data = await env.URL_STORE.get(shortCode);

  if (!data) {
    return new Response(JSON.stringify({ error: '短链接不存在' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(request, env) },
    });
  }

  await env.URL_STORE.delete(shortCode);

  return new Response(JSON.stringify({ success: true, message: '短链接已删除' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(request, env) },
  });
}

// 获取短链接列表
async function listUrls(request, env) {
  const requestUrl = new URL(request.url);
  const limitParam = requestUrl.searchParams.get('limit');
  const cursor = requestUrl.searchParams.get('cursor') || undefined;
  let limit = Number.parseInt(limitParam || '100', 10);

  if (Number.isNaN(limit) || limit <= 0) {
    limit = 100;
  }

  if (limit > 1000) {
    limit = 1000;
  }

  const listResult = await env.URL_STORE.list({ limit, cursor });
  const items = await Promise.all(listResult.keys.map(async (key) => {
    const value = await env.URL_STORE.get(key.name);
    if (!value) return null;
    try {
      const data = JSON.parse(value);
      return {
        url: data.url,
        shortCode: data.shortCode || key.name,
        createdAt: data.createdAt,
        clicks: data.clicks || 0,
        username: data.username || '',
      };
    } catch {
      return null;
    }
  }));

  return new Response(JSON.stringify({
    items: items.filter(Boolean),
    cursor: listResult.cursor || null,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(request, env) },
  });
}

// 批量删除短链接
async function deleteUrlsBatch(request, env) {
  try {
    const { shortCodes } = await request.json();

    if (!Array.isArray(shortCodes) || shortCodes.length === 0) {
      return new Response(JSON.stringify({ error: 'shortCodes 不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(request, env) },
      });
    }

    const trimmedCodes = shortCodes.map((code) => (typeof code === 'string' ? code.trim() : ''))
      .filter((code) => code);

    if (trimmedCodes.length === 0) {
      return new Response(JSON.stringify({ error: 'shortCodes 不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(request, env) },
      });
    }

    const results = await Promise.all(trimmedCodes.map(async (code) => {
      const data = await env.URL_STORE.get(code);
      if (!data) return { code, deleted: false };
      await env.URL_STORE.delete(code);
      return { code, deleted: true };
    }));

    const deleted = results.filter((item) => item.deleted).map((item) => item.code);
    const notFound = results.filter((item) => !item.deleted).map((item) => item.code);

    return new Response(JSON.stringify({
      success: true,
      deleted,
      notFound,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(request, env) },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: '请求处理失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(request, env) },
    });
  }
}

// 主处理函数
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(request, env),
      });
    }

    // API 路由
    if (path.startsWith('/api/')) {
      // 创建短链接
      if (path === '/api/shorten' && request.method === 'POST') {
        return createShortUrl(request, env);
      }

      // 获取短链接列表
      if (path === '/api/list' && request.method === 'GET') {
        return listUrls(request, env);
      }

      // 批量删除短链接
      if (path === '/api/batch-delete' && request.method === 'POST') {
        return deleteUrlsBatch(request, env);
      }

      // 删除短链接
      if (path.startsWith('/api/') && request.method === 'DELETE') {
        const shortCode = path.split('/api/')[1];
        return deleteUrl(request, shortCode, env);
      }

      return new Response(JSON.stringify({ error: 'API 路由不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(request, env) },
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
  "customCode": "mycode", // 可选，自定义短码
  "username": "alice" // 可选，创建者
}</pre>

            <h3>2. 访问短链接</h3>
            <pre>GET /{shortCode}</pre>

            <h3>3. 获取短链接列表</h3>
            <pre>GET /api/list</pre>

            <h3>4. 批量删除短链接</h3>
            <pre>POST /api/batch-delete</pre>

            <h3>5. 删除短链接</h3>
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
