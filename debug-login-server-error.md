# Debug Session: login-server-error
**Status:** [OPEN]
**Opened:** 2026-09-27 20:35 MSK
**Symptom:** wexa.su/login → пользователь видит красный алерт «Ошибка сервера при входе» после ввода валидных кредов. HTTP 500 от POST /api/auth/login.
**Regression window:** Последний коммит `42d7f51` (Balance feature) → VDS deploy update.sh exitcode=0.
**Impact:** Критичный — никто не может войти в ЛК/админку.

---

## Hypotheses (falsifiable)

### H1 (SQLite schema mismatch — HIGH likelihood)
Поле `User.balance DECIMAL(12,2)` добавлено в модель [User.ts](file:///c:/workspace/mainsite3/server/models/User.ts), но `fix-db`/`sequelize.sync({alter:false})` НЕ добавил колонку `balance` в существующую таблицу `users` на VDS SQLite. При `User.findOne({where:{email}})` sequelize может вернуть объект БЕЗ поля balance, а затем `res.json({user:{...user, balance}})` падает (или authController пытается обратиться к `user.balance` в строке template literal → TypeError).

### H2 (Platega .env — MEDIUM)
На VDS обновился код, но НЕТ PLATEGA_MERCHANT_ID / SECRET в .env. При первом запросе login/me где-то подтягивается PlategaService.createPayment → throw. Менее вероятно, что логин триггерит Platega.

### H3 (WalletTransaction ассоциация — LOW)
User.hasMany(WalletTransaction as walletTransactions) в [models/index.ts](file:///c:/workspace/mainsite3/server/models/index.ts) — синхронизация sequelize.sync({ alter:false }) пытается создать внешний ключ в wallet_transactions, но таблица users ещё не имеет balance → catch вылезает при первом findAll.

### H4 (PM2 process is running but index.ts crashes on require)
`server/index.ts` импортирует `walletRoutes`, который импортирует `balanceService`, который импортирует `WalletTransaction` модель с DECIMAL(12,2). Возможно sqlite3 driver не поддерживает DECIMAL → parse error, процесс падает при старте, PM2 перезапускает в цикле → gateway 502 / catch-all 500.

---

## Evidence collection plan
1. **Сразу SSH VDS**: `pm2 logs mainsite --nostream --lines 100` → ищем stack trace TypeError / SequelizeDatabaseError / SQLite Error no such column: users.balance
2. SQLite PRAGMA table_info(users); → есть ли колонка balance
3. `ls -la /root/mainsite3/.env` — проверка PLATEGA env
4. Manual curl POST /api/auth/login admin@example.com/admin → HTTP код, JSON ошибка

---

## Findings (evidence gated)
