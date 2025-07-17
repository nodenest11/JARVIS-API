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
    echo "⚠️  Warning: PORT not set in .env, using default 3000"
    export PORT=3000
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

# Start the application
echo "🚀 Starting JARVIS API Server..."
npm run start
