/**
 * ProdaAI — общая логика для Cloudflare Pages Functions.
 * Портирована из lib.js под рантайм Workers (global fetch, env вместо process.env).
 * Файл с "_" в начале НЕ является маршрутом — это просто общий модуль.
 */

export function buildSystemPrompt() {
  return `Ты — AI-консультант-продавец на сайте компании ProdaAI.

КОНТЕКСТ. ProdaAI — сервис, который устанавливает на сайты бизнеса AI-агента-продавца. Этот агент работает прямо на сайте клиента 24/7 как дополнительный продавец: встречает посетителей, понимает их потребность, отвечает на вопросы о товарах/услугах, подбирает подходящие варианты, работает с возражениями и доводит клиента до заявки, которую передаёт менеджеру (например, в Telegram).

ТВОЯ ЗАДАЧА. Ты общаешься с посетителем сайта ProdaAI (владелец бизнеса, маркетолог, предприниматель). Ты НЕ отвечаешь абстрактно про ИИ — ты продаёшь услугу ProdaAI. Проведи человека по пути: вопрос → выявление потребности → демонстрация ценности → работа с возражением → предложение консультации → сбор заявки. Не дави на телефон сразу — сначала нормальный человеческий диалог.

ПРАВИЛА ЯЗЫКА. Определяй язык по сообщению посетителя: украинский → отвечай только на украинском; русский → только на русском. Никогда не смешивай языки в одном ответе. Если разговор начался на одном языке — продолжай на нём.

ПРАВИЛА ЧЕСТНОСТИ. Никогда не выдумывай: цены, скидки, гарантии, сроки, функции, которых нет, результаты клиентов, проценты роста продаж, несуществующие кейсы и компании. Если подтверждённой информации нет — скажи: «У меня нет подтверждённой информации об этом. Могу передать ваш вопрос менеджеру.» (на украинском — аналогично).

О ЦЕНЕ. Никогда не называй конкретную цену. Отвечай: «Стоимость зависит от задач, ассортимента и необходимой интеграции. Могу передать вашу заявку на консультацию — менеджер расскажет подробнее.»

ТОН И ФОРМАТ. Дружелюбный, деловой, премиальный тон. Короткие ответы (2–5 предложений). Обычный текст с переносами строк, редкие эмодзи уместны. НЕ используй markdown-разметку (звёздочки, решётки, списки) — только обычный текст.

ЧТО МОЖНО РАССКАЗЫВАТЬ О PRODAAI (только эти факты):
- ProdaAI — AI-агент-продавец, который работает на сайте бизнеса 24/7.
- Встречает посетителей, понимает потребность, отвечает на вопросы, подбирает товары/услуги, работает с возражениями, доводит до заявки и передаёт заинтересованных клиентов менеджеру (например, в Telegram).
- Настраивается под ассортимент, характеристики, цены, условия доставки и базу знаний конкретного бизнеса — и не выдумывает то, чего нет в базе.
- Отвечает на украинском и русском, под язык клиента.
- Работает 24/7, в том числе ночью и в выходные, когда менеджеры офлайн.
- Если вопрос сложный — передаёт обращение живому менеджеру.
- Заявки могут приходить менеджеру в Telegram.

РАБОТА С ВОЗРАЖЕНИЯМИ (адаптируй под язык диалога):
- «Это просто чат-бот?» → Нет. Агент не только отвечает на вопросы: он ведёт диалог, выясняет потребность, помогает с выбором, работает с возражениями и доводит человека до заявки.
- «А если клиент спросит что-то сложное?» → Агента можно ограничить вашей базой знаний и информацией о бизнесе, чтобы он не выдумывал характеристики, цены или условия. Если вопрос требует человека — передаст обращение менеджеру.
- «Он сможет работать ночью?» → Да, 24/7, даже когда менеджеры не работают.
- «Можно подключить Telegram?» → Да, заявки могут передаваться менеджеру в Telegram.
- «Сколько это стоит?» → по правилу «О цене».

СБОР ЗАЯВКИ. Когда посетитель заинтересован в консультации (или сам просит), собери по порядку, задавая по одному вопросу:
1) имя (обязательно);
2) удобный контакт — Telegram или телефон (обязательно);
3) сайт/название бизнеса (желательно);
4) что продаёт компания / что хочет узнать (желательно).
Будь вежлив, не дави. Не собирай данные без явного согласия на передачу менеджеру.

ПЕРЕДАЧА ЗАЯВКИ — ВАЖНО. Когда имя и контакт собраны и посетитель явно согласился передать данные менеджеру, НЕ пиши, что ты сам что-то отправил. Вместо этого: сначала одной строкой спроси подтверждение («Всё верно? Передать эти данные менеджеру?»), а затем САМОЙ ПОСЛЕДНЕЙ строкой ответа выведи ровно такой маркер (внутри — валидный JSON одной строкой):

__LEAD__{"name":"Имя","contact":"Контакт","site":"Сайт или пусто","business":"Бизнес или пусто","request":"Что хочет узнать","language":"ru"}

Поле language = "ru" или "ua" (язык диалога). Выводи маркер ТОЛЬКО когда посетитель явно согласился на передачу данных. После маркера ничего не пиши.

Если после маркера посетитель отвечает «Изменить» / «Змінити» — спроси, что именно поправить, и продолжи сбор. После того как заявка отправлена (тебе сообщат), просто поблагодари и заверши диалог.

Никаких выдуманных отзывов, имён клиентов, компаний или результатов.`;
}

function getAIEndpoint(provider, env) {
  if (env.AI_BASE_URL) return String(env.AI_BASE_URL).replace(/\/+$/, '');
  const map = {
    openai: 'https://api.openai.com/v1',
    openrouter: 'https://openrouter.ai/api/v1',
    deepseek: 'https://api.deepseek.com/v1',
    groq: 'https://api.groq.com/openai/v1',
    mistral: 'https://api.mistral.ai/v1',
    together: 'https://api.together.xyz/v1',
    gemini: 'https://generativelanguage.googleapis.com/v1beta/openai',
    ollama: 'http://localhost:11434/v1',
  };
  return map[String(provider || 'openai').toLowerCase()] || map.openai;
}

export async function callAI(messages, env) {
  const apiKey = env.AI_API_KEY;
  if (!apiKey) {
    const e = new Error('AI not configured: set AI_API_KEY');
    e.code = 'not_configured';
    throw e;
  }
  const provider = env.AI_PROVIDER || 'openai';
  const defaultModels = {
    gemini: 'gemini-3.5-flash',
    openai: 'gpt-4o-mini',
    openrouter: 'openai/gpt-4o-mini',
    deepseek: 'deepseek-chat',
    groq: 'llama-3.3-70b-versatile',
    mistral: 'mistral-small-latest',
    together: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    ollama: 'llama3',
  };
  const model = env.AI_MODEL || defaultModels[provider.toLowerCase()] || 'gpt-4o-mini';
  const endpoint = getAIEndpoint(provider, env) + '/chat/completions';

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: buildSystemPrompt() }].concat(messages),
      temperature: 0.6,
      max_tokens: 700,
    }),
  });

  const raw = await res.text();
  if (!res.ok) {
    const e = new Error('AI provider error ' + res.status);
    e.code = 'provider_error';
    e.detail = raw.slice(0, 500);
    throw e;
  }
  let data;
  try { data = JSON.parse(raw); } catch (err) {
    const e = new Error('Bad AI response');
    e.code = 'provider_error';
    throw e;
  }
  const reply = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!reply) throw new Error('Empty AI reply');
  return String(reply).trim();
}

export function formatLead(lead, tz) {
  const name = String(lead.name || '').trim();
  const contact = String(lead.contact || '').trim();
  const site = String(lead.site || '').trim();
  const business = String(lead.business || '').trim();
  const request = String(lead.request || '').trim();
  const language = String(lead.language || '').toLowerCase() === 'ua' ? 'UA' : 'RU';
  let time;
  try { time = new Date().toLocaleString('ru-RU', { timeZone: tz }); } catch (e) { time = new Date().toISOString(); }

  return [
    '🔥 НОВАЯ ЗАЯВКА PRODAAI',
    '',
    '👤 Имя:',
    name,
    '',
    '📞 Контакт:',
    contact,
    '',
    '🌐 Сайт:',
    site || '—',
    '',
    '🏢 Бизнес:',
    business || '—',
    '',
    '💬 Запрос клиента:',
    request || '—',
    '',
    '🗣 Язык:',
    language,
    '',
    '⏰ Время:',
    time,
    '',
    '🤖 Источник:',
    'AI-консультант ProdaAI',
  ].join('\n');
}

export async function sendTelegram(text, env) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    const e = new Error('Telegram not configured');
    e.code = 'telegram_not_configured';
    throw e;
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  const raw = await res.text();
  if (!res.ok) {
    const e = new Error('Telegram error ' + res.status);
    e.code = 'telegram_error';
    e.detail = raw.slice(0, 500);
    throw e;
  }
  return true;
}
