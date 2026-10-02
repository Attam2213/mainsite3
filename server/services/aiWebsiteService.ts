import { AI_PRICING } from '../utils/aiPricing';
import type { AIProvider } from '../models/AITransaction';

export interface WexaWebsiteFile {
  path: string;
  content: string;
}

export interface WexaWebsitePayload {
  plan: 'landing' | 'business' | 'premium';
  meta: {
    title: string;
    description: string;
    domainSuggested: string;
  };
  files: WexaWebsiteFile[];
  ecosystem?: { apps?: Array<Record<string, unknown>> } | null;
  postInstallCommands?: string[];
}

export function buildWebsitePrompt(input: {
  description: string;
  businessName: string;
  contacts: string;
  colors: string;
  sections: string;
  plan: 'landing' | 'business' | 'premium';
  language: 'ru' | 'en';
}): string {
  return `# Роль: Ты — Wexa AI, Senior Full-stack разработчик сайтов для хостинга wexa.su.

## ОБЯЗАТЕЛЬНЫЕ ТРЕБОВАНИЯ К ОКРУЖЕНИЮ (НЕ ОТКЛОНЯТЬСЯ!):
Пользователь создал заказ на хостинге Wexa.su. Серверная среда УЖЕ настроена. Ты НЕ должен писать про Docker/Vercel/Netlify/Ngrok — никогда. Только NATIVE:
- Nginx reverse proxy на shared веб-ноде Ubuntu 24.04 LTS, порт {APP_PORT}=3000+
- Node.js 22 LTS, PM2 ecosystem.config.js (переменная NODE_ENV=production)
- Папка chroot SFTP пользователя /srv/sftp/wexa_site_XXXX/app. Заливаем ТОЛЬКО файлы внутрь.
- База данных: для Landing = БЕЗ БД. Для Business/Premium = SQLite в ./data/app.db (Sequelize или better-sqlite3). NO Postgres/MySQL!
- Зависимости: ТОЛЬКО package.json минимальный. Линтинг не добавлять.

## ЗАПРОС ПОЛЬЗОВАТЕЛЯ:
- Название/бренд: ${input.businessName || '(не указано)'}
- Описание проекта (что делает сайт): ${input.description}
- Разделы сайта (через запятую): ${input.sections || 'Главная, О нас, Услуги, Контакты'}
- Цветовая тема: ${input.colors || 'индиго/бирюзовый (Wexa дефолт)'}
- Контакты/соцсети/реквизиты: ${input.contacts || '(не указаны)'}
- Тариф хостинга Wexa: ${input.plan}. ${input.plan === 'landing' ? 'STATIC ONLY HTML/CSS/JS. NO Node backend!' : input.plan === 'business' ? 'Node.js Express + EJS шаблонизатор.' : 'Premium: Node.js + Express + SQLite + Redis (опционально).'}
- Язык контента: ${input.language === 'en' ? 'English' : 'Русский'}

## СТРУКТУРА ФАЙЛОВ (ОБЯЗАТЕЛЬНАЯ!):
${input.plan === 'landing' ? `Landing plan = ТОЛЬКО статика:
- index.html (Главная)
- about.html, services.html, contacts.html (или все в одном index.html с якорями)
- css/style.css (отзывчивый дизайн, Tailwind через CDN <script> разрешен!)
- js/main.js (анимации, форма обратной связи через fetch -> submit.php НЕТ, используй formspree-free или mailto)
- assets/ (если есть img placeholder data:URI/svg inline NOT external files!)
- NO package.json, NO node_modules, NO server. Статический сайт.` : `Business/Premium plan = Node.js + Express + EJS:
- package.json {"name":"wexa-site","main":"server/index.js","dependencies":{"express":"^4.19.2","ejs":"^3.1.10","better-sqlite3":"^11.3.0","dotenv":"^16.4.5"}}
- server/index.js — Express app.listen(process.env.PORT||3000), EJS views engine, static public/
- ecosystem.config.js — {"apps":[{"name":process.env.WEXA_SITE_ID || 'site',"script":"server/index.js","env":{"NODE_ENV":"production","PORT":process.env.PORT || 3000}}]}
- views/layout.ejs, views/index.ejs, views/about.ejs, views/contact.ejs
- public/css/style.css, public/js/main.js
- data/ (empty папка, код создаёт app.db при первом запуске)`}

## ФОРМАТ ОТВЕТА — ЕДИНСТВЕННЫЙ JSON! НИКАКОГО ТЕКСТА ВНЕ JSON:
Верни РОВНО ОДИН JSON объект такого типа, без тройных кавычек ${'```'}, без markdown:
{
  "plan": "${input.plan}",
  "meta": { "title": "Название в <title> страницы", "description": "meta description", "domainSuggested": "кратко.slug.wexa.su" },
  "files": [ { "path": "относительный путь как в структуре выше", "content": "СОДЕРЖИМОЕ ФАЙЛА, строка, \\n разделители, ВСЕ СИМВОЛЫ ЭКРАНИРОВАНЫ" }, ... ],
  "postInstallCommands": ["npm install --omit=dev"],
  "ecosystem": ${input.plan === 'landing' ? 'null' : '{"apps":[{"name":"wexa-site","script":"server/index.js"}]}'}
}

ОЧЕНЬ ВАЖНО:
1. Полный код всех файлов = 100% рабочий. Никаких "...здесь..." или "допиши".
2. Весь текстовый контент = ${input.language === 'en' ? 'English' : 'Русский'}, адаптирован под описание пользователя. Реалистичный копирайт.
3. ВСЕ SVG placeholder logo/icons = встроенные data URI или inline SVG. НЕ внешние image URL.
4. Форма обратной связи = реально отправляет. Landing: Formspree action или mailto. Business: POST /api/contact -> console.log(data) + nodemailer или ответ JSON {ok:true}.
5. Footer содержит "© 2026 {Бренд} · Хостинг Wexa.su" и ссылки.
6. Design: modern, hero section с градиентом, карточки services, адаптив mobile-first. Цвета = ${input.colors || 'индиго #4f46e5 + розовый #ec4899 как у Wexa.su'}.
7. СТРОГО JSON без предваряющего текста. Если ты хочешь комментарии — положи их в объект JSON в поле "_notes" отдельно.
`;
}

export async function callLLM(
  provider: AIProvider,
  apiKey: string,
  systemPrompt: string,
  userPrompt: string
): Promise<{ answer: string; inputTokens: number; outputTokens: number }> {
  const cfg = AI_PRICING[provider];
  const model = cfg.defaultModel;
  const timeout = 180_000;

  if (provider === 'openai') {
    const body = {
      model,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 16000,
    };
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeout),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`OpenAI ${res.status}: ${t.slice(0, 300)}`);
    }
    const json = (await res.json()) as any;
    const ans: string = json?.choices?.[0]?.message?.content || '';
    const inT: number = json?.usage?.prompt_tokens ?? Math.ceil((systemPrompt + userPrompt).length / 4);
    const outT: number = json?.usage?.completion_tokens ?? Math.ceil(ans.length / 4);
    return { answer: ans, inputTokens: inT, outputTokens: outT };
  }

  if (provider === 'anthropic') {
    const body = {
      model,
      max_tokens: 16000,
      temperature: 0.4,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    };
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeout),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`Anthropic ${res.status}: ${t.slice(0, 300)}`);
    }
    const json = (await res.json()) as any;
    const blocks = json?.content || [];
    const ans = Array.isArray(blocks) ? blocks.map((b: any) => b.text || '').join('') : '';
    const inT = json?.usage?.input_tokens ?? Math.ceil((systemPrompt + userPrompt).length / 4);
    const outT = json?.usage?.output_tokens ?? Math.ceil(ans.length / 4);
    return { answer: ans, inputTokens: inT, outputTokens: outT };
  }

  const body = {
    model,
    generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 16000, temperature: 0.4 },
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
  };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeout),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Gemini ${res.status}: ${t.slice(0, 300)}`);
  }
  const json = (await res.json()) as any;
  const ans: string = json?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || '';
  const total = json?.usageMetadata;
  const inT = total?.promptTokenCount ?? Math.ceil((systemPrompt + userPrompt).length / 4);
  const outT = total?.candidatesTokenCount ?? Math.ceil(ans.length / 4);
  return { answer: ans, inputTokens: inT, outputTokens: outT };
}

export function extractPayload(rawAnswer: string): WexaWebsitePayload {
  let text = rawAnswer.trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  const firstObj = text.indexOf('{');
  const lastObj = text.lastIndexOf('}');
  if (firstObj === -1 || lastObj === -1) throw new Error('LLM не вернул JSON объект');
  const slice = text.slice(firstObj, lastObj + 1);
  const parsed = JSON.parse(slice);
  if (!parsed || !Array.isArray(parsed.files) || parsed.files.length === 0) {
    throw new Error('Нет поля files[] в ответе LLM');
  }
  return parsed as WexaWebsitePayload;
}
