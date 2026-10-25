/**
 * Одноразовая авторизация YouTube.
 *
 * Что делает:
 *   1. поднимает локальный сервер на http://localhost:8765
 *   2. печатает ссылку согласия Google
 *   3. ловит ?code=... и меняет его на refresh_token
 *   4. сохраняет promo/publish/token.json
 *
 * Запуск:  npm run auth
 *
 * Нужен файл client_secret.json (OAuth-клиент типа "Desktop app",
 * скачанный из Google Cloud Console) рядом с этим скриптом.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SECRET_FILE = path.join(HERE, "client_secret.json");
const TOKEN_FILE = path.join(HERE, "token.json");
const SCOPE = "https://www.googleapis.com/auth/youtube.upload";
const PORT = Number(process.env.PORT || 8765);
const REDIRECT = `http://localhost:${PORT}`;

function loadClient() {
  if (fs.existsSync(SECRET_FILE)) {
    const raw = JSON.parse(fs.readFileSync(SECRET_FILE, "utf8"));
    const block = raw.installed || raw.web || raw;
    if (block.client_id && block.client_secret) {
      return { client_id: block.client_id, client_secret: block.client_secret };
    }
  }
  const id = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (id && secret) return { client_id: id, client_secret: secret };
  throw new Error(
    "Не найден client_secret.json и нет GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET",
  );
}

async function exchange(code, client) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: client.client_id,
      client_secret: client.client_secret,
      redirect_uri: REDIRECT,
      grant_type: "authorization_code",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`token exchange failed: ${JSON.stringify(data)}`);
  if (!data.refresh_token) {
    throw new Error(
      "Google не вернул refresh_token. Отзовите доступ приложению в " +
        "https://myaccount.google.com/permissions и повторите вход.",
    );
  }
  return data;
}

const client = loadClient();
const authUrl =
  "https://accounts.google.com/o/oauth2/v2/auth?" +
  new URLSearchParams({
    client_id: client.client_id,
    redirect_uri: REDIRECT,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
  });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT);
  const code = url.searchParams.get("code");
  const err = url.searchParams.get("error");

  if (err) {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(`Ошибка авторизации: ${err}`);
    console.error(`\nОшибка авторизации: ${err}`);
    server.close();
    process.exit(1);
  }
  if (!code) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Ожидаю ?code=...");
    return;
  }

  try {
    const tokens = await exchange(code, client);
    fs.writeFileSync(
      TOKEN_FILE,
      JSON.stringify(
        {
          client_id: client.client_id,
          client_secret: client.client_secret,
          refresh_token: tokens.refresh_token,
          scope: tokens.scope,
          savedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h2>Готово. Токен сохранён — можно закрыть вкладку.</h2>");
    console.log(`\nТокен сохранён: ${TOKEN_FILE}`);
    server.close();
    process.exit(0);
  } catch (e) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(String(e.message));
    console.error(`\n${e.message}`);
    server.close();
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log("\nОткройте эту ссылку в браузере и подтвердите доступ:\n");
  console.log(authUrl);
  console.log(`\nЖду ответ на ${REDIRECT} ...`);
});
