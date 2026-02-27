#!/bin/bash

# Update script for Mainsite VDS

# Exit on error
set -e

echo "=========================================="
echo "      Mainsite VDS Update Script          "
echo "=========================================="

# 1. Pull latest changes
echo "[1/4] Pulling latest changes from git..."
git pull

# 2. Install dependencies
echo "[2/4] Installing dependencies..."
npm install

# 3. Rebuild frontend
echo "[3/4] Rebuilding frontend..."
npm run build

# 4. Restart backend
echo "[4/4] Restarting application..."
pm2 restart mainsite

echo "=========================================="
echo "      Update Complete!                    "
echo "=========================================="
