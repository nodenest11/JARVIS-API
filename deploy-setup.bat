@echo off
echo ===================================================
echo        JARVIS API - DigitalOcean Setup Script
echo ===================================================
echo.

echo Creating production .env file...
(
echo # Production Environment Configuration
echo NODE_ENV=production
echo PORT=3002
echo BASE_URL=http://159.89.166.91:3002
echo.
echo # API Keys - REPLACE WITH YOUR ACTUAL KEYS
echo # IMPORTANT: Each key must follow the correct format!
echo.
echo # Groq API Key - Format: starts with "gsk_"
echo # Get from: https://console.groq.com/keys
echo GROQ_API_KEY=gsk_your_groq_key_here
echo.
echo # GitHub Token - Format: Personal Access Token with Copilot access
echo # Get from: https://github.com/settings/tokens
echo GITHUB_TOKEN=your_github_token_here
echo.
echo # OpenRouter API Key - Format: starts with "sk-or-"
echo # Get from: https://openrouter.ai/keys
echo OPENROUTER_API_KEY=sk-or-your_openrouter_key_here
echo.
echo # Gemini API Key - Get from Google AI Studio
echo # Get from: https://aistudio.google.com/app/apikey
echo GEMINI_API_KEY=your_gemini_key_here
) > .env.production

echo ✅ .env.production file created successfully!
echo.
echo 🔧 IMPORTANT: You need to edit the .env.production file and add your actual API keys!
echo    Then copy it to your DigitalOcean server as .env
echo.
echo 📋 Required API Keys:
echo    1. GROQ_API_KEY     - Get from https://console.groq.com/keys
echo    2. GITHUB_TOKEN     - Get from https://github.com/settings/tokens
echo    3. OPENROUTER_API_KEY - Get from https://openrouter.ai/keys
echo    4. GEMINI_API_KEY   - Get from https://aistudio.google.com/app/apikey
echo.
echo 💡 After uploading to server, restart the application:
echo    pm2 restart jarvis-api
echo.
echo 🔍 To check if keys are loaded correctly:
echo    curl -X GET http://159.89.166.91:3002/api/status
echo.
echo ===================================================
pause
