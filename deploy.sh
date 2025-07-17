#!/bin/bash

# JARVIS API - DigitalOcean Deployment Script
# This script configures and starts the JARVIS API on DigitalOcean

echo "🚀 Starting JARVIS API Deployment on DigitalOcean..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env file with your configuration"
    exit 1
fi

# Load environment variables
source .env

# Validate required environment variables
if [ -z "$PORT" ]; then
    echo "⚠️  Warning: PORT not set in .env, using default 3002"
    export PORT=3002
fi

if [ -z "$NODE_ENV" ]; then
    echo "⚠️  Warning: NODE_ENV not set, using production"
    export NODE_ENV=production
fi

# Display configuration
echo "📋 Deployment Configuration:"
echo "   Port: $PORT"
echo "   Environment: $NODE_ENV"
echo "   Base URL: $BASE_URL"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# Stop existing PM2 process if running
echo "🔄 Stopping existing PM2 process..."
pm2 stop jarvis-api 2>/dev/null || true
pm2 delete jarvis-api 2>/dev/null || true

# Start with PM2
echo "🚀 Starting JARVIS API Server with PM2..."
pm2 start ecosystem.config.json --env $NODE_ENV

# Save PM2 configuration
pm2 save

# Setup PM2 startup if not already configured
if ! pm2 startup | grep -q "already"; then
    echo "⚙️  Configuring PM2 startup..."
    pm2 startup
fi

echo ""
echo "✅ Deployment completed successfully!"
echo "📊 Use 'pm2 status' to check the process status"
echo "📋 Use 'pm2 logs jarvis-api' to view logs"
echo "🔄 Use 'pm2 restart jarvis-api' to restart the service"
