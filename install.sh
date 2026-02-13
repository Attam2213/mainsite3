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

# 3. Установка глобальных инструментов
echo "🛠 Устанавливаем PM2 и TSX..."
sudo npm install -g pm2 tsx

# 4. Установка Nginx и Certbot (для SSL)
echo "🌐 Устанавливаем Nginx и Certbot..."
sudo apt install -y nginx certbot python3-certbot-nginx

# 5. Установка зависимостей проекта
echo "📂 Устанавливаем библиотеки проекта..."
npm install

echo "🏗 Собираем Frontend..."
npm run build

# 6. Запрос домена
echo ""
echo "❓ Введи свой домен (например, mysite.com):"
read DOMAIN_NAME

if [ -z "$DOMAIN_NAME" ]; then
    echo "❌ Домен не введен. Выход."
    exit 1
fi

# 7. Настройка Nginx
echo "⚙️ Настраиваем Nginx для $DOMAIN_NAME..."
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN_NAME"
CURRENT_DIR=$(pwd)

sudo bash -c "cat > $NGINX_CONF" <<EOL
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

# 8. Получение SSL сертификата
echo "🔒 Получаем SSL сертификат (HTTPS)..."
sudo certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME --non-interactive --agree-tos -m admin@$DOMAIN_NAME --redirect

# 9. Запуск приложения через PM2
echo "🚀 Запускаем сервер..."
pm2 delete mainsite3 || true
pm2 start "npm run start" --name mainsite3
pm2 save
pm2 startup

echo "✅ Установка завершена! Твой сайт доступен: https://$DOMAIN_NAME"
