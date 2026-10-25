/**
 * Загрузка роликов в TikTok Studio через Playwright.
 *
 * Почему браузер, а не API: у TikTok Content Posting API обязательное ревью
 * приложения, и без него ролики уходят только приватными. Автоматизация
 * браузера работает сразу.
 *
 * Запуск:
 *   npm run tt                — все ролики из videos.json
 *   npm run tt -- games       — только указанные ключи
 *   npm run tt -- --dry       — открыть окно и дойти до формы, без публикации
 *
 * Первый запуск: откроется окно Chromium. Войдите в TikTok вручную
 * (пароль + 2FA + капча остаются у вас), затем вернитесь в терминал —
 * скрипт сам дождётся страницы загрузки. Профиль сохраняется в
 * .tiktok-profile/, при следующих запусках вход не потребуется.
 *
 * ВАЖНО: TikTok часто меняет вёрстку Studio. Если какой-то шаг не находится,
 * скрипт сделает скриншот в .tmp/ — по нему правится селектор.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_FILE = path.join(HERE, "videos.json");
const PROFILE_DIR = path.join(HERE, ".tiktok-profile");
const STATE_FILE = path.join(HERE, "uploaded-tiktok.json");
const SHOTS_DIR = path.join(HERE, ".tmp");

const UPLOAD_URL = "https://www.tiktok.com/tiktokstudio/upload?from=upload";
const LOGIN_WAIT_MS = 10 * 60 * 1000;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry");
const wanted = args.filter((a) => !a.startsWith("--"));

const config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
const state = fs.existsSync(STATE_FILE)
  ? JSON.parse(fs.readFileSync(STATE_FILE, "utf8"))
  : {};

const SELECTORS = {
  fileInput: ['input[type="file"][accept*="video"]', 'input[type="file"]'],
  caption: [
    '.public-DraftEditor-content[contenteditable="true"]',
    'div[contenteditable="true"]',
    'textarea[placeholder*="aption"]',
  ],
  postButton: [
    'button[data-e2e="post_video_button"]',
    'button:has-text("Опубликовать")',
    'button:has-text("Post")',
  ],
};

async function firstVisible(page, selectors, timeout) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    for (const sel of selectors) {
      const loc = page.locator(sel).first();
      try {
        if (await loc.isVisible({ timeout: 800 })) return loc;
      } catch {
        /* пробуем следующий селектор */
      }
    }
    await page.waitForTimeout(700);
  }
  return null;
}

async function firstPresent(page, selectors, timeout) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    for (const sel of selectors) {
      const loc = page.locator(sel).first();
      try {
        if ((await loc.count()) > 0) return loc;
      } catch {
        /* пробуем следующий селектор */
      }
    }
    await page.waitForTimeout(700);
  }
  return null;
}

async function shot(page, name) {
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
  const file = path.join(SHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false }).catch(() => {});
  console.log(`     скриншот: ${file}`);
}

async function dismissBlockingUi(page) {
  for (let i = 0; i < 4; i++) {
    try {
      const contentCheckTitle = page.locator('text="Включить автоматическую проверку контента?"').first();
      if (await contentCheckTitle.isVisible({ timeout: 500 })) {
        const enableBtn = page.locator('button:has-text("Включить")').first();
        if (await enableBtn.isVisible({ timeout: 500 })) {
          await enableBtn.click({ force: true });
          await page.waitForTimeout(1200);
          continue;
        }
      }
    } catch {
      /* ignore */
    }

    try {
      const cancelUploadTitle = page.locator('text="Отменить загрузку?"').first();
      if (await cancelUploadTitle.isVisible({ timeout: 500 })) {
        const keepBtn = page.locator('button:has-text("Нет")').first();
        if (await keepBtn.isVisible({ timeout: 500 })) {
          await keepBtn.click({ force: true });
          await page.waitForTimeout(800);
          continue;
        }
      }
    } catch {
      /* ignore */
    }

    try {
      const gotItBtn = page.locator('button:has-text("Понятно")').first();
      if (await gotItBtn.isVisible({ timeout: 500 })) {
        await gotItBtn.click({ force: true });
        await page.waitForTimeout(800);
        continue;
      }
    } catch {
      /* ignore */
    }

    try {
      const fallbackBtn = page.locator('button:has-text("Not now"), button:has-text("Cancel"), button:has-text("OK")').first();
      if (await fallbackBtn.isVisible({ timeout: 500 })) {
        await fallbackBtn.click({ force: true });
        await page.waitForTimeout(800);
        continue;
      }
    } catch {
      /* ignore */
    }

    try {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
    } catch {
      /* ignore */
    }

    try {
      const stillOpen =
        (await page.locator('text="Включить автоматическую проверку контента?"').count()) > 0 ||
        (await page.locator('text="Отменить загрузку?"').count()) > 0 ||
        (await page.locator('button:has-text("Понятно")').count()) > 0;
      if (!stillOpen) break;
    } catch {
      break;
    }
  }
}

async function recoverUploadForm(page) {
  await page.goto(UPLOAD_URL, { waitUntil: "domcontentloaded" }).catch(() => {});
  await dismissBlockingUi(page);
  return await firstPresent(page, SELECTORS.fileInput, 60_000);
}

const list = config.videos.filter((v) => !wanted.length || wanted.includes(v.key));
if (!list.length) {
  console.error("Нечего загружать. Ключи: " + config.videos.map((v) => v.key).join(", "));
  process.exit(1);
}

fs.mkdirSync(PROFILE_DIR, { recursive: true });

const context = await chromium.launchPersistentContext(PROFILE_DIR, {
  headless: false,
  viewport: { width: 1440, height: 960 },
  locale: "ru-RU",
  args: ["--disable-blink-features=AutomationControlled"],
});
const page = context.pages()[0] || (await context.newPage());

console.log("Открываю TikTok Studio...");
await page.goto(UPLOAD_URL, { waitUntil: "domcontentloaded" }).catch(() => {});

console.log(
  "\nЕсли появилась страница входа — войдите в аккаунт прямо в открытом окне.\n" +
    "Жду до 10 минут появления формы загрузки...\n",
);

let input = await firstPresent(page, SELECTORS.fileInput, LOGIN_WAIT_MS);
if (!input) {
  await shot(page, "login-timeout");
  console.error("Форма загрузки не появилась. Проверьте скриншот.");
  await context.close();
  process.exit(1);
}
console.log("Форма загрузки найдена.\n");

for (const entry of list) {
  if (state[entry.key]?.at && !args.includes("--force")) {
    console.log(`[skip] ${entry.key}: уже загружено ${state[entry.key].at}`);
    continue;
  }

  const filePath = path.resolve(HERE, entry.file);
  if (!fs.existsSync(filePath)) {
    console.error(`[!!] ${entry.key}: файл не найден — ${filePath}`);
    continue;
  }

  const caption = [entry.tiktokTitle, entry.tiktokBody, entry.tiktokTags]
    .filter(Boolean)
    .join("\n");

  console.log(`[..] ${entry.key}: загружаю "${entry.tiktokTitle}"`);

  try {
    if (!input || !(await input.count().catch(() => 0))) {
      input = await firstPresent(page, SELECTORS.fileInput, 30_000);
      if (!input) throw new Error("поле выбора файла пропало");
    }
    await input.setInputFiles(filePath);
    await page.waitForTimeout(2500);
    await dismissBlockingUi(page);

    const editor = await firstVisible(page, SELECTORS.caption, 120_000);
    if (!editor) {
      await shot(page, `${entry.key}-no-editor`);
      throw new Error("не нашёл поле описания");
    }

    await dismissBlockingUi(page);
    await editor.click({ force: true });
    await page.keyboard.press("Control+A");
    await page.keyboard.press("Delete");
    await page.keyboard.insertText(caption);
    await page.waitForTimeout(1500);
    await dismissBlockingUi(page);

    await shot(page, `${entry.key}-before-post`);

    if (dryRun) {
      console.log(`     --dry: форма заполнена, публикация не запущена`);
      continue;
    }

    const postBtn = await firstVisible(page, SELECTORS.postButton, 60_000);
    if (!postBtn) {
      await shot(page, `${entry.key}-no-button`);
      throw new Error("не нашёл кнопку публикации");
    }
    await postBtn.click();
    await page.waitForTimeout(20_000);

    state[entry.key] = { at: new Date().toISOString(), file: entry.file };
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    console.log(`     отправлено на публикацию`);

    input = await recoverUploadForm(page);
    if (!input) throw new Error("после публикации не вернулась форма загрузки");
  } catch (e) {
    console.error(`     ошибка: ${e.message}`);
    await shot(page, `${entry.key}-error`);
    input = await recoverUploadForm(page);
  }
}

console.log("\nГотово. Окно закроется через 5 секунд.");
await page.waitForTimeout(5000);
await context.close();
