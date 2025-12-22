import { corsHeaders } from '../utils.js';

// GET 方法：获取短链接信息（从 info/[code].js 复制的逻辑）
export async function onRequestGet(context) {
  const { params, env } = context;
  const shortCode = params.code;

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

// DELETE 方法：删除短链接
export async function onRequestDelete(context) {
  const { params, env } = context;
  const shortCode = params.code;

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

// OPTIONS 方法：CORS 预检
export async function onRequestOptions() {
  return new Response(null, {
    headers: corsHeaders(),
  });
}
