import { sendTelegram, formatLead } from '../_shared.js';

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

// POST /api/lead
export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try { body = await request.json(); } catch (e) { return json({ error: 'bad_request' }, 400); }

  const name = String(body.name || '').trim();
  const contact = String(body.contact || '').trim();
  if (!name || !contact) return json({ error: 'invalid_lead' }, 400);

  try {
    await sendTelegram(formatLead(body, env.TZ || 'Europe/Kyiv'), env);
    return json({ ok: true });
  } catch (e) {
    if (e.code === 'telegram_not_configured') return json({ error: 'telegram_not_configured' }, 503);
    console.error('[lead]', e.message, e.detail || '');
    return json({ error: 'telegram_error' }, 502);
  }
}
