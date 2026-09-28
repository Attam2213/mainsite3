#!/bin/bash
# Wexa.su: Web Node provisioning script (Ubuntu 22.04 / 24.04 LTS)
# Idempotent: можно перезапускать много раз без ошибок
# Target VDS: 82.146.47.246 (shared web hosting 1GB RAM, no Docker)

set -u
LOG_FILE="/var/log/wexa-setup-web-node.log"
exec > >(tee -a "$LOG_FILE") 2>&1
echo "=== Wexa Web Node provision $(date -Iseconds) ==="

export DEBIAN_FRONTEND=noninteractive

# 1. Обновления и утилиты
echo "[1/8] apt update + utils..."
apt-get update -y
apt-get install -y \
  curl wget git unzip tar gzip rsync openssh-server openssl locales \
  ca-certificates gnupg lsb-release sudo cron \
  python3-certbot-nginx nginx-full ufw jq bc

# 2. Node.js 20 LTS nodesource
echo "[2/8] Node.js 20 LTS..."
if ! command -v node >/dev/null 2>&1 || ! node -v | grep -qE '^v20\.' ; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo "Node: $(node -v), npm: $(npm -v)"

# 3. PM2 + systemd startup (global)
echo "[3/8] PM2 global..."
if ! command -v pm2 >/dev/null 2>&1 ; then
  npm i -g pm2
fi
pm2 update || true
# auto systemd startup (исполняется один раз)
if ! systemctl is-enabled --quiet pm2-root 2>/dev/null; then
  env PATH="$PATH:/usr/bin" pm2 startup systemd -u root --hp /root 2>&1 | tail -3
  systemctl enable pm2-root 2>/dev/null || true
  systemctl start pm2-root 2>/dev/null || true
fi
pm2 save || true
echo "PM2: $(pm2 -v)"

# 4. Группы / пользователи SFTP
echo "[4/8] SFTP sftponly group..."
if ! getent group sftponly >/dev/null 2>&1 ; then
  groupadd --system sftponly
fi
# Пользователь wexa-www-data (unprivileged web deploy)
if ! id wexa-www-data >/dev/null 2>&1; then
  useradd -r -M -s /usr/sbin/nologin wexa-www-data
fi

# 5. Директории Wexa
echo "[5/8] Wexa directories..."
mkdir -p /var/lib/wexa/sites
mkdir -p /var/lib/wexa/backups/sites
mkdir -p /var/lib/wexa/templates
mkdir -p /srv/sftp
mkdir -p /etc/nginx/conf.d/wexa-sites

chown -R root:root /srv/sftp
chmod 755 /srv/sftp
chown -R wexa-www-data:wexa-www-data /var/lib/wexa/sites 2>/dev/null || true
chown -R root:root /var/lib/wexa/backups 2>/dev/null || true
chmod 750 /var/lib/wexa/backups
chmod -R u+rwX,go+rX /var/lib/wexa/sites 2>/dev/null || true

# 6. sshd_config: Match Group sftponly ChrootDirectory SFTP only
echo "[6/8] sshd_config SFTP Chroot sftponly..."
SSHD_CONFIG="/etc/ssh/sshd_config"
MARK_START="# BEGIN WEXA SFTPONLY"
MARK_END="# END WEXA SFTPONLY"

# Удаляем старый блок если есть
sed -i "/^${MARK_START}/,/^${MARK_END}/d" "$SSHD_CONFIG"
# Добавляем
cat >> "$SSHD_CONFIG" <<EOF
$MARK_START
# Автогенерация Wexa web-node setup — не редактируйте руками.
Match Group sftponly
    ChrootDirectory /srv/sftp/%u
    ForceCommand internal-sftp
    AllowTcpForwarding no
    X11Forwarding no
    PasswordAuthentication yes
    PermitTunnel no
$MARK_END
EOF

# Валидация sshd синтаксиса
if ! sshd -t ; then
  echo "ERROR: sshd_config invalid syntax! Rollback aborted"
  exit 1
fi
systemctl restart ssh 2>/dev/null || systemctl restart sshd

# 7. Nginx: include /etc/nginx/conf.d/wexa-sites/*.conf
echo "[7/8] Nginx include wexa-sites/*.conf..."
# Ubuntu default sites-enabled includes conf.d/*.conf автоматически, но на всякий случай:
if ! grep -qR "/etc/nginx/conf.d/wexa-sites" /etc/nginx/ ; then
  # add include если его нет
  if [ -f /etc/nginx/nginx.conf ]; then
    # add include в http блоке перед закрывающей скобкой
    if ! grep -q "include /etc/nginx/conf.d/wexa-sites" /etc/nginx/nginx.conf ; then
      # insert last } HTTP block include
      # fallback создаём отдельный drop-in conf-enabled
      echo "include /etc/nginx/conf.d/wexa-sites/*.conf;" > /etc/nginx/conf.d/99-wexa-include.conf
    fi
  fi
fi
if ! nginx -t ; then
  echo "ERROR: nginx config invalid after include!"
  exit 2
fi
systemctl restart nginx

# 8. Cron daily backup rotate 7 days web sites
echo "[8/8] Cron daily backup script..."
CRON_SCRIPT="/usr/local/bin/wexa-daily-web-backup.sh"
cat > "$CRON_SCRIPT" <<'BACKUP_EOF'
#!/bin/bash
set -e
WEB_ROOT="/var/lib/wexa/sites"
BACKUP_ROOT="/var/lib/wexa/backups/sites"
RETENTION_DAYS=7
mkdir -p "$BACKUP_ROOT"
DATE="$(date +%Y%m%d)"
for SITE_ID in $(ls -1 "$WEB_ROOT" 2>/dev/null | head -200); do
  SRC="$WEB_ROOT/$SITE_ID"
  [ -d "$SRC" ] || continue
  DEST_DIR="$BACKUP_ROOT/$SITE_ID"
  mkdir -p "$DEST_DIR"
  TARBALL="$DEST_DIR/${DATE}.tar.gz"
  if [ ! -f "$TARBALL" ]; then
    tar -czf "$TARBALL" -C "$(dirname "$SRC")" "$(basename "$SRC")"
    echo "backup ok $SITE_ID $DATE"
  fi
  # delete older than RETENTION_DAYS
  find "$DEST_DIR" -type f -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
done
BACKUP_EOF
chmod +x "$CRON_SCRIPT"
# install cron daily at 04:05 MSK (UTC+3 = 01:05 UTC)
CRON_LINE="5 1 * * * root $CRON_SCRIPT >> /var/log/wexa-web-backups.log 2>&1"
if ! grep -qF "$CRON_SCRIPT" /etc/crontab /etc/cron.d/* 2>/dev/null; then
  echo "$CRON_LINE" > /etc/cron.d/wexa-web-backup
  chmod 0644 /etc/cron.d/wexa-web-backup
fi

# 9. Seed Orlan-taxi template (пустой — user upload files later)
TEMPLATE_DIR="/var/lib/wexa/templates/orlan-taxi-business"
mkdir -p "$TEMPLATE_DIR/views" "$TEMPLATE_DIR/public/assets/img" "$TEMPLATE_DIR/public/assets/styles" "$TEMPLATE_DIR/public/assets/js"
cat > "$TEMPLATE_DIR/package.json" <<'EOF'
{
  "name": "wexa-site-template-business",
  "version": "1.0.0",
  "description": "Wexa.su Business template — Node.js Express + EJS",
  "main": "server.js",
  "scripts": {"start": "node server.js"},
  "dependencies": {
    "express": "^4.21.0",
    "ejs": "^3.1.10",
    "dotenv": "^16.4.5",
    "body-parser": "^1.20.3"
  }
}
EOF
cat > "$TEMPLATE_DIR/server.js" <<'EOF'
require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json({limit:'5mb'}));
app.use(bodyParser.urlencoded({extended:true, limit:'5mb'}));
app.use('/assets', express.static(path.join(__dirname,'public/assets')));
app.get('/', (req, res) => res.render('index', {title: 'Ваш сайт на Wexa.su'}));
app.get('/health', (req,res) => res.status(200).json({ok:true,site:'wexa-site'}));
app.listen(PORT, '127.0.0.1', () => console.log(`[wexa-site] listening 127.0.0.1:${PORT}`));
EOF
cat > "$TEMPLATE_DIR/views/index.ejs" <<'EOF'
<!DOCTYPE html>
<html lang="ru"><head><meta charset="UTF-8"><title><%= title || 'Wexa.su' %></title>
<meta name="viewport" content="width=device-width,initial-scale=1"><style>
body{font-family:system-ui,sans-serif;margin:0;display:flex;min-height:100vh;align-items:center;justify-content:center;background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);color:#fff}
.box{max-width:620px;padding:2.5rem 3rem;border-radius:1.25rem;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(10px)}
h1{font-size:1.9rem;margin:0 0 .75rem}p{color:#cbd5e1;line-height:1.55;margin:.5rem 0}
.tag{display:inline-block;padding:.25rem .6rem;border-radius:999px;background:#22c55e22;color:#86efac;font-size:.75rem;margin-bottom:1rem;font-weight:600;letter-spacing:.04em}
</style></head><body><div class="box">
<span class="tag">WEXA.SU — WEB HOSTING BUSINESS</span>
<h1>Сайт успешно развёрнут 🎉</h1>
<p>Загрузите свои файлы через <strong>SFTP</strong> (данные в ЛК wexa.su) или используйте встроенный файловый менеджер в панели управления.</p>
<p>Ваш шаблон: Express + EJS. Редактируйте файл <code>/views/index.ejs</code> и обновите страницу — изменения применятся мгновенно.</p>
<p style="margin-top:1.5rem;font-size:.85rem;color:#94a3b8">Powered by wexa.su · shared web node · auto SSL · backups 7 дней</p>
</div></body></html>
EOF
cat > "$TEMPLATE_DIR/.env.example" <<EOF
PORT=3000
EOF

echo "✅ Wexa web-node provision complete $(date -Iseconds)"
echo "   Node: $(node -v) · PM2: $(pm2 -v) · Nginx: $(nginx -v 2>&1)"
echo "   SFTP chroot group: sftponly -> /srv/sftp/<user>"
echo "   Directories: /var/lib/wexa/sites /var/lib/wexa/backups/sites /var/lib/wexa/templates/orlan-taxi-business"
echo "   Daily backup cron: 04:05 MSK, rotate 7 days."
