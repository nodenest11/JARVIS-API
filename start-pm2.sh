#!/bin/bash

# JARVIS API - PM2 Startup Script
# This script ensures environment variables are loaded correctly when starting with PM2

echo "🚀 Starting JARVIS API with PM2..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env file with your configuration"
    exit 1
fi

# Load environment variables
export $(cat .env | xargs)

# Display current environment
echo "📋 Environment Variables:"
echo "   NODE_ENV: $NODE_ENV"
echo "   PORT: $PORT"
echo "   BASE_URL: $BASE_URL"
echo ""

# Stop existing process
pm2 stop jarvis-api 2>/dev/null || true
pm2 delete jarvis-api 2>/dev/null || true

# Start with PM2 using environment variables
pm2 start index.js --name jarvis-api --env production

# Save PM2 configuration
pm2 save

echo "✅ JARVIS API started successfully with PM2!"
echo "📊 Use 'pm2 status' to check status"
echo "📋 Use 'pm2 logs jarvis-api' to view logs"
