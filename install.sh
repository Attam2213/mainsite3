#!/bin/bash

# Останавливаем скрипт при любой ошибке
set -e

echo "🚀 Начинаем автоматическую установку..."

# 1. Обновление системы
echo "📦 Обновляем системные пакеты..."
sudo apt update && sudo apt upgrade -y

# 2. Установка Node.js 20 (если нет)
if ! command -v node &> /dev/null; then
    echo "🟢 Устанавливаем Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "✅ Node.js уже установлен"
fi

# 3. Установка PostgreSQL
echo \"🐘 Устанавливаем PostgreSQL...\"
sudo apt install -y postgresql postgresql-contrib

# 4. Установка глобальных инструментов
echo \"🛠 Устанавливаем PM2 и TSX...\"
sudo npm install -g pm2 tsx

# 5. Установка Nginx и Certbot (для SSL)
echo \"🌐 Устанавливаем Nginx и Certbot...\"
sudo apt install -y nginx certbot python3-certbot-nginx

# 6. Параметры базы данных (без специальных флагов, чтобы работало везде)
echo ""
echo "📛 Имя БД [mainsite3]:"
read DB_NAME
DB_NAME=${DB_NAME:-mainsite3}

echo "👤 Пользователь БД [mainsite3]:"
read DB_USER
DB_USER=${DB_USER:-mainsite3}

echo "🔑 Пароль для пользователя БД:"
read DB_PASS

echo "🔐 Использовать SSL для подключения к БД? [y/N]:"
read USE_SSL
POSTGRES_SSL=false
if [[ "$USE_SSL" =~ ^[Yy]$ ]]; then
  POSTGRES_SSL=true
fi

echo \"🗄 Создаём пользователя и базу...\"
sudo -u postgres psql <<SQL
DO
\$do\$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
      CREATE ROLE $DB_USER LOGIN PASSWORD '$DB_PASS';
   END IF;
END
\$do\$;
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
SQL

# 7. Установка зависимостей проекта
echo \"📂 Устанавливаем библиотеки проекта...\"
npm install

echo \"🏗 Собираем Frontend...\"
npm run build

# 8. Запрос домена
echo \"\"
echo \"❓ Введи свой домен (например, mysite.com):\"
read DOMAIN_NAME

if [ -z \"$DOMAIN_NAME\" ]; then
    echo \"❌ Домен не введен. Выход.\"
    exit 1
fi

# 9. Настройка Nginx
echo \"⚙️ Настраиваем Nginx для $DOMAIN_NAME...\"
NGINX_CONF=\"/etc/nginx/sites-available/$DOMAIN_NAME\"
CURRENT_DIR=$(pwd)

sudo bash -c \"cat > $NGINX_CONF\" <<EOL
server {
    listen 80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

    root $CURRENT_DIR/dist;
    index index.html;

    # Frontend (все пути на index.html для React Router)
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

# Включаем сайт
sudo ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# 10. Получение SSL сертификата
echo "🔒 Получаем SSL сертификат (HTTPS)..."
sudo certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME --non-interactive --agree-tos -m admin@$DOMAIN_NAME --redirect

# 11. Запуск приложения через PM2 (PostgreSQL)
echo "🚀 Запускаем сервер..."
pm2 delete mainsite3 || true
POSTGRES_URL="postgres://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME" POSTGRES_SSL=$POSTGRES_SSL pm2 start "npm run start" --name mainsite3
pm2 save
pm2 startup

echo "✅ Установка завершена! Твой сайт доступен: https://$DOMAIN_NAME"
