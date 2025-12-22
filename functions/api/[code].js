import { corsHeaders } from '../utils.js';

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

export async function onRequestOptions() {
  return new Response(null, {
    headers: corsHeaders(),
  });
}
