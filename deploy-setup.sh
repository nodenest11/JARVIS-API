#!/bin/bash

# JARVIS API - DigitalOcean Deployment Setup Script
# This script helps set up environment variables on your DigitalOcean server

echo "====================================================="
echo "        JARVIS API - DigitalOcean Setup Script"
echo "====================================================="
echo ""

# Create .env file for production
echo "Creating production .env file..."
cat > .env << EOF
# Production Environment Configuration
NODE_ENV=production
PORT=3002
BASE_URL=http://159.89.166.91:3002

# API Keys - REPLACE WITH YOUR ACTUAL KEYS
# IMPORTANT: Each key must follow the correct format!

# Groq API Key - Format: starts with "gsk_"
# Get from: https://console.groq.com/keys
GROQ_API_KEY=gsk_your_groq_key_here

# GitHub Token - Format: Personal Access Token with Copilot access
# Get from: https://github.com/settings/tokens
GITHUB_TOKEN=your_github_token_here

# OpenRouter API Key - Format: starts with "sk-or-"
# Get from: https://openrouter.ai/keys
OPENROUTER_API_KEY=sk-or-your_openrouter_key_here

# Gemini API Key - Get from Google AI Studio
# Get from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_key_here
EOF

echo "✅ .env file created successfully!"
echo ""
echo "🔧 IMPORTANT: You need to edit the .env file and add your actual API keys!"
echo "   Run: nano .env"
echo ""
echo "📋 Required API Keys:"
echo "   1. GROQ_API_KEY     - Get from https://console.groq.com/keys"
echo "   2. GITHUB_TOKEN     - Get from https://github.com/settings/tokens"
echo "   3. OPENROUTER_API_KEY - Get from https://openrouter.ai/keys"
echo "   4. GEMINI_API_KEY   - Get from https://aistudio.google.com/app/apikey"
echo ""
echo "💡 After adding your API keys, restart the application:"
echo "   pm2 restart jarvis-api"
echo ""
echo "🔍 To check if keys are loaded correctly:"
echo "   curl -X GET http://159.89.166.91:3002/api/status"
echo ""
echo "====================================================="
