#!/bin/bash

# Exit on error
set -e

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "Please run as root (sudo ./install.sh)"
  exit 1
fi

echo "=========================================="
echo "      Mainsite VDS Installer Script       "
echo "=========================================="

# 1. Update System
echo "[1/10] Updating system packages..."
apt update && apt upgrade -y

# 2. Install Dependencies
echo "[2/10] Installing dependencies..."
apt install -y curl git build-essential nginx certbot python3-certbot-nginx postgresql postgresql-contrib ufw

# Configure Firewall
echo "Configuring firewall..."
ufw allow 'Nginx Full'
ufw allow OpenSSH
# Enable firewall only if user confirms or force it? Let's force it for security on VDS
ufw --force enable

# 3. Install Node.js (v20 LTS)
echo "[3/10] Installing Node.js v20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
else
    echo "Node.js is already installed."
fi

# Install PM2 globally
npm install -g pm2

# 4. User Input
echo "[4/10] Configuration..."
read -p "Enter your domain name (e.g., example.com): " DOMAIN_NAME
if [ -z "$DOMAIN_NAME" ]; then
    echo "Domain name is required!"
    exit 1
fi

read -s -p "Enter password for PostgreSQL user 'mainsite_user': " DB_PASSWORD
echo ""
if [ -z "$DB_PASSWORD" ]; then
    echo "Database password is required!"
    exit 1
fi

# 5. Configure PostgreSQL
echo "[5/10] Configuring PostgreSQL..."
systemctl enable postgresql
systemctl start postgresql

# Create user and database if they don't exist
# We use sudo -u postgres to run psql commands as the postgres superuser
sudo -u postgres psql -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'mainsite_user') THEN CREATE USER mainsite_user WITH PASSWORD '$DB_PASSWORD'; END IF; END \$\$;"
sudo -u postgres psql -c "ALTER USER mainsite_user WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "SELECT 'CREATE DATABASE mainsite_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'mainsite_db')\gexec"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE mainsite_db TO mainsite_user;"
# Grant schema usage explicitly just in case
sudo -u postgres psql -d mainsite_db -c "GRANT ALL ON SCHEMA public TO mainsite_user;"

# 6. Setup Project
echo "[6/10] Setting up project..."
# Install all dependencies (including devDeps for building)
npm install

# Build the frontend
echo "Building frontend..."
npm run build

# Create .env file
echo "Creating .env file..."
# Generate a random JWT secret
JWT_SECRET=$(openssl rand -hex 32)

cat > .env <<EOL
DB_DIALECT=postgres
DB_NAME=mainsite_db
DB_USER=mainsite_user
DB_PASSWORD=$DB_PASSWORD
DB_HOST=localhost
DB_PORT=5432
PORT=5000
JWT_SECRET=$JWT_SECRET
NODE_ENV=production
EOL

# 7. Configure Nginx
echo "[7/10] Configuring Nginx..."
PROJECT_DIR=$(pwd)
# Ensure dist directory exists
if [ ! -d "$PROJECT_DIR/dist" ]; then
    echo "Error: dist directory not found. Build failed?"
    exit 1
fi

# Create Nginx config
cat > /etc/nginx/sites-available/$DOMAIN_NAME <<EOL
server {
    listen 80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

    root $PROJECT_DIR/dist;
    index index.html;

    # Frontend (SPA)
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

# Enable site
ln -sf /etc/nginx/sites-available/$DOMAIN_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# 8. Setup SSL
echo "[8/10] Setting up SSL with Certbot..."
# Non-interactive mode requires email and agreement
certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME --non-interactive --agree-tos -m admin@$DOMAIN_NAME --redirect

# 9. Start Application with PM2
echo "[9/10] Starting application..."
# Stop existing instance if any
pm2 delete mainsite 2>/dev/null || true
# Start new instance using npm start command
pm2 start npm --name "mainsite" -- run start
pm2 save
pm2 startup

# 10. Finalize
echo "[10/10] Finalizing..."
chmod +x update.sh

echo "=========================================="
echo "      Installation Complete!              "
echo "      Site: https://$DOMAIN_NAME          "
echo "=========================================="
