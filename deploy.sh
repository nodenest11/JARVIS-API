#!/bin/bash

echo "🚀 Starting JARVIS API Auto-Update..."

cd /home/pratham/jarvis-api || exit

# Pull latest code (overwrite old files but keep .env)
echo "📥 Pulling latest code from GitHub..."
git fetch --all
git reset --hard origin/main

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    exit 1
fi

source .env

echo "📦 Installing dependencies..."
npm install

echo "🔄 Restarting PM2 process..."
pm2 stop jarvis-api || true
pm2 delete jarvis-api || true
pm2 start ecosystem.config.json --env $NODE_ENV
pm2 save

echo "✅ Update & Deployment done!"
