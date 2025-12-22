import { corsHeaders } from '../../utils.js';

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

export async function onRequestOptions() {
  return new Response(null, {
    headers: corsHeaders(),
  });
}
