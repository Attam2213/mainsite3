
#!/bin/bash
# ==========================================
# Mainsite Game Server Node Setup Script
# ==========================================
# This script sets up a fresh VDS as a game hosting node.
# It installs Docker, necessary tools, and prepares directories for game assemblies.

set -e

echo "Starting Game Node setup..."

# 1. Update system
echo "[1/5] Updating system packages..."
apt-get update && apt-get upgrade -y
apt-get install -y curl wget unzip jq ufw

# 2. Install Docker
echo "[2/5] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
else
    echo "Docker is already installed."
fi

# 3. Pull Base Images
echo "[3/5] Pulling base game server images..."
docker pull itzg/minecraft-server:latest
docker pull joedwards32/cs2:latest
docker pull hlds/server:latest
docker pull archont94/counter-strike1.6:latest
# Add other images here as needed

# 4. Setup Directories for Assemblies (Builds)
echo "[4/5] Creating directories for assemblies..."
mkdir -p /opt/wexa/assemblies
mkdir -p /opt/wexa/servers

# 5. Configure Firewall (UFW)
echo "[5/5] Configuring firewall..."
# Allow SSH
ufw allow OpenSSH
# Allow Minecraft default ports range (e.g., 25565-25600)
ufw allow 25565:25600/tcp
ufw allow 25565:25600/udp
# Allow CS2 default ports range (e.g., 27015-27100)
ufw allow 27015:27100/tcp
ufw allow 27015:27100/udp
# Allow CS 1.6 default ports range (e.g., 27015-27100, same as CS2 usually)
# Enable firewall
ufw --force enable

echo "=========================================="
echo "      Game Node Setup Complete!           "
echo "=========================================="
echo "Builds directory: /opt/wexa/assemblies"
echo "To add a build manually: upload .zip to /opt/wexa/assemblies/"
echo "To deploy a build: use deploy-assembly.sh script"
