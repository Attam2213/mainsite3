/**
 * Загрузка роликов на YouTube через Data API v3 (videos.insert).
 *
 * Запуск:
 *   npm run yt                 — загрузить все ролики из videos.json
 *   npm run yt -- games        — загрузить только указанные ключи
 *   npm run yt -- --dry        — показать, что будет загружено, без отправки
 *   npm run yt -- --privacy=unlisted
 *
 * Требует token.json (см. youtube-auth.mjs).
 * Ограничение квоты: 1 загрузка = 1600 юнитов, по умолчанию 10000/сутки
 * (примерно 6 роликов в день).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TOKEN_FILE = path.join(HERE, "token.json");
const CONFIG_FILE = path.join(HERE, "videos.json");
const STATE_FILE = path.join(HERE, "uploaded.json");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry");
const privacyArg = (args.find((a) => a.startsWith("--privacy=")) || "").split("=")[1];
const wanted = args.filter((a) => !a.startsWith("--"));

if (!fs.existsSync(TOKEN_FILE)) {
  console.error("Нет token.json. Сначала выполните: npm run auth");
  process.exit(1);
}

const token = JSON.parse(fs.readFileSync(TOKEN_FILE, "utf8"));
const config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
const state = fs.existsSync(STATE_FILE)
  ? JSON.parse(fs.readFileSync(STATE_FILE, "utf8"))
  : {};

async function accessToken() {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: token.client_id,
      client_secret: token.client_secret,
      refresh_token: token.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`refresh failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

function buildBody(meta, filePath) {
  const boundary = `wexa${Date.now()}${Math.floor(Math.random() * 1e6)}`;
  const head = Buffer.from(
    `--${boundary}\r\n` +
      "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
      `${JSON.stringify(meta)}\r\n` +
      `--${boundary}\r\n` +
      "Content-Type: video/mp4\r\n\r\n",
  );
  const tail = Buffer.from(`\r\n--${boundary}--`);
  const body = Buffer.concat([head, fs.readFileSync(filePath), tail]);
  return { body, contentType: `multipart/related; boundary=${boundary}` };
}

async function upload(entry, at) {
  const filePath = path.resolve(HERE, entry.file);
  if (!fs.existsSync(filePath)) throw new Error(`Файл не найден: ${filePath}`);

  const meta = {
    snippet: {
      title: entry.title,
      description: entry.description,
      tags: entry.tags,
      categoryId: entry.categoryId || config.categoryId || "20",
      defaultLanguage: "ru",
    },
    status: {
      privacyStatus: privacyArg || config.privacyStatus || "public",
      selfDeclaredMadeForKids: false,
      embeddable: true,
    },
  };

  const { body, contentType } = buildBody(meta, filePath);
  const url =
    "https://www.googleapis.com/upload/youtube/v3/videos" +
    "?uploadType=multipart&part=snippet,status";

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${at}`, "Content-Type": contentType },
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`upload failed: ${JSON.stringify(data.error || data)}`);
  return data;
}

const list = config.videos.filter((v) => !wanted.length || wanted.includes(v.key));
if (!list.length) {
  console.error("Нечего загружать. Ключи в videos.json: " + config.videos.map((v) => v.key).join(", "));
  process.exit(1);
}

const at = dryRun ? null : await accessToken();

for (const entry of list) {
  if (state[entry.key]?.videoId && !args.includes("--force")) {
    console.log(`[skip] ${entry.key}: уже загружено → ${state[entry.key].url}`);
    continue;
  }
  if (dryRun) {
    console.log(`[dry] ${entry.key} → "${entry.title}" (${entry.file})`);
    continue;
  }
  process.stdout.write(`[..] ${entry.key}: загружаю "${entry.title}" ... `);
  try {
    const data = await upload(entry, at);
    state[entry.key] = {
      videoId: data.id,
      url: `https://youtube.com/shorts/${data.id}`,
      uploadedAt: new Date().toISOString(),
    };
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    console.log(`ок\n     https://youtube.com/shorts/${data.id}`);
  } catch (e) {
    console.log("ошибка");
    console.error(`     ${e.message}`);
  }
}
