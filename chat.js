import { callAI } from '../_shared.js';

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

// POST /api/chat
export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try { body = await request.json(); } catch (e) { return json({ error: 'bad_request' }, 400); }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (!messages.length) return json({ error: 'bad_request' }, 400);

  try {
    const reply = await callAI(messages, env);
    return json({ reply });
  } catch (e) {
    if (e.code === 'not_configured') return json({ error: 'not_configured' }, 503);
    console.error('[chat]', e.message, e.detail || '');
    return json({ error: 'provider_error' }, 502);
  }
}
