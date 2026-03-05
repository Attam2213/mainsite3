
#!/bin/bash

# VDS Setup Script
# Usage: ./setup-vds.sh <TOKEN> <API_URL>

TOKEN=$1
API_URL=$2

if [ -z "$TOKEN" ] || [ -z "$API_URL" ]; then
    echo "Usage: $0 <TOKEN> <API_URL>"
    exit 1
fi

echo "Starting VDS setup..."

# 1. Update system
echo "Updating system packages..."
apt-get update && apt-get upgrade -y

# 2. Install dependencies
echo "Installing dependencies..."
apt-get install -y curl wget git nginx certbot python3-certbot-nginx

# 3. Install Node.js (LTS)
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# 4. Install PM2
echo "Installing PM2..."
npm install -g pm2

# 5. Configure Nginx
echo "Configuring Nginx..."
mkdir -p /var/www/vds-sites
chown -R www-data:www-data /var/www/vds-sites

# Create a default configuration for handling multiple domains
cat > /etc/nginx/sites-available/vds-manager <<EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    root /var/www/html;
    index index.html index.htm index.nginx-debian.html;
    server_name _;

    location / {
        try_files \$uri \$uri/ =404;
    }
}
EOF

# Enable default site (if not already enabled, though we might want to disable it later)
ln -s /etc/nginx/sites-available/vds-manager /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
service nginx restart

# 6. Create VDS Agent (Enhanced Node.js script)
echo "Setting up VDS Agent..."
mkdir -p /opt/vds-agent
cd /opt/vds-agent

cat > package.json <<EOF
{
  "name": "vds-agent",
  "version": "1.0.0",
  "description": "VDS Agent for management",
  "main": "index.js",
  "dependencies": {
    "axios": "^1.6.0",
    "systeminformation": "^5.21.0",
    "fs-extra": "^11.2.0"
  }
}
EOF

cat > index.js <<EOF
const axios = require('axios');
const si = require('systeminformation');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');

const TOKEN = '$TOKEN';
const API_URL = '$API_URL';
const SITES_DIR = '/var/www/vds-sites';
const NGINX_SITES_AVAILABLE = '/etc/nginx/sites-available';
const NGINX_SITES_ENABLED = '/etc/nginx/sites-enabled';

// Configure axios defaults
axios.defaults.headers.common['x-agent-token'] = TOKEN;

async function reportStatus() {
    try {
        const load = await si.currentLoad();
        const mem = await si.mem();
        const disk = await si.fsSize();
        
        // Get public IP if possible, or let server determine from request
        // For simplicity, we just send load data

        await axios.post(\`\${API_URL}/api/agent/heartbeat\`, {
            load: load.currentLoad,
            memory: {
                total: mem.total,
                used: mem.used,
                active: mem.active
            },
            disk: disk[0] ? {
                size: disk[0].size,
                used: disk[0].used
            } : null
        });
        console.log('Heartbeat sent');
    } catch (error) {
        console.error('Error sending heartbeat:', error.message);
    }
}

async function pollTasks() {
    try {
        const response = await axios.get(\`\${API_URL}/api/agent/tasks\`);
        const tasks = response.data.tasks || [];

        for (const task of tasks) {
            console.log('Processing task:', task);
            if (task.type === 'create_site') {
                await createSite(task);
            }
        }
    } catch (error) {
        console.error('Error polling tasks:', error.message);
    }
}

async function createSite(task) {
    const { id, payload } = task;
    const { domain, settings, cmsVersion } = payload;
    const sitePath = path.join(SITES_DIR, domain);

    try {
        // 1. Create directory
        await fs.ensureDir(sitePath);
        
        // 2. Create index.html (Simple CMS Placeholder)
        const htmlContent = \`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>\${settings.title || 'Welcome'}</title>
    <style>
        body { font-family: sans-serif; margin: 0; padding: 0; background-color: \${settings.theme === 'dark' ? '#1a202c' : '#f7fafc'}; color: \${settings.theme === 'dark' ? '#fff' : '#1a202c'}; }
        .hero { background-color: \${settings.primaryColor || '#4f46e5'}; color: white; padding: 4rem 2rem; text-align: center; }
        .container { max-width: 800px; margin: 0 auto; padding: 2rem; }
    </style>
</head>
<body>
    <div class="hero">
        <h1>\${settings.heroTitle || 'Welcome'}</h1>
        <p>\${settings.heroSubtitle || 'Site under construction'}</p>
    </div>
    <div class="container">
        <p>\${settings.description || ''}</p>
    </div>
</body>
</html>
\`;
        await fs.writeFile(path.join(sitePath, 'index.html'), htmlContent);
        
        // 3. Create Nginx config
        const nginxConfig = \`
server {
    listen 80;
    server_name \${domain} www.\${domain};
    root \${sitePath};
    index index.html;

    location / {
        try_files \\\$uri \\\$uri/ =404;
    }
}
\`;
        await fs.writeFile(path.join(NGINX_SITES_AVAILABLE, domain), nginxConfig);
        
        // 4. Enable site
        if (!await fs.pathExists(path.join(NGINX_SITES_ENABLED, domain))) {
             await fs.symlink(path.join(NGINX_SITES_AVAILABLE, domain), path.join(NGINX_SITES_ENABLED, domain));
        }

        // 5. Reload Nginx
        exec('service nginx reload', async (error) => {
            if (error) {
                console.error('Error reloading nginx:', error);
                await reportTaskCompletion(id, false, error.message);
                return;
            }
            console.log('Site created successfully:', domain);
            await reportTaskCompletion(id, true);
        });

    } catch (error) {
        console.error('Error creating site:', error);
        await reportTaskCompletion(id, false, error.message);
    }
}

async function reportTaskCompletion(taskId, success, error = null) {
    try {
        await axios.post(\`\${API_URL}/api/agent/tasks/\${taskId}/complete\`, {
            success,
            error
        });
    } catch (err) {
        console.error('Error reporting task completion:', err.message);
    }
}

// Start loops
setInterval(reportStatus, 60000); // Heartbeat every 1 minute
setInterval(pollTasks, 10000);   // Poll tasks every 10 seconds

console.log('VDS Agent started');
reportStatus(); // Initial heartbeat
EOF

# Install dependencies
npm install

# Setup PM2
pm2 start index.js --name vds-agent
pm2 save
pm2 startup

echo "VDS Setup Complete!"
