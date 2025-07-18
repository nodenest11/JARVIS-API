# JARVIS API - DigitalOcean Deployment Guide

## Issue Resolution: AI Service Unavailable

The error you're encountering is because your DigitalOcean server doesn't have the required API keys configured. The API keys are stored in environment variables that need to be set up on your server.

## Quick Fix Steps

### Step 1: Set up API Keys on DigitalOcean Server

1. **SSH into your DigitalOcean server:**
   ```bash
   ssh root@159.89.166.91
   ```

2. **Navigate to your project directory:**
   ```bash
   cd /home/pratham/jarvis-api
   ```

3. **Create a .env file with your API keys:**
   ```bash
   nano .env
   ```

4. **Add the following content (replace with your actual API keys):**
   ```env
   # Production Environment Configuration
   NODE_ENV=production
   PORT=3002
   BASE_URL=http://159.89.166.91:3002

   # API Keys - REPLACE WITH YOUR ACTUAL KEYS
   # IMPORTANT: Each key must follow the correct format!

   # Groq API Key - Format: starts with "gsk_"
   GROQ_API_KEY=gsk_your_actual_groq_key_here

   # GitHub Token - Format: Personal Access Token with Copilot access
   GITHUB_TOKEN=your_actual_github_token_here

   # OpenRouter API Key - Format: starts with "sk-or-"
   OPENROUTER_API_KEY=sk-or-your_actual_openrouter_key_here

   # Gemini API Key - Get from Google AI Studio
   GEMINI_API_KEY=your_actual_gemini_key_here
   ```

5. **Save and exit nano:**
   - Press `Ctrl + X`
   - Press `Y` to confirm
   - Press `Enter` to save

6. **Restart your application:**
   ```bash
   pm2 restart jarvis-api
   ```

### Step 2: Verify the Fix

Test your API endpoint:
```bash
curl --location 'http://159.89.166.91:3002/api/chat' \
--header 'Content-Type: application/json' \
--data '{"message": "Hello, JARVIS!"}'
```

You should now get a successful response instead of the error.

## How to Get API Keys

### 1. Groq API Key
- Go to: https://console.groq.com/keys
- Create a new API key
- Format: `gsk_xxxxxxxxxxxxxxxxxx`

### 2. GitHub Token
- Go to: https://github.com/settings/tokens
- Create a Personal Access Token
- Enable Copilot access
- Format: `github_pat_xxxxxxxxxxxxxxxxxx`

### 3. OpenRouter API Key
- Go to: https://openrouter.ai/keys
- Create a new API key
- Format: `sk-or-v1-xxxxxxxxxxxxxxxxxx`

### 4. Gemini API Key
- Go to: https://aistudio.google.com/app/apikey
- Create a new API key
- Format: `AIzaSyxxxxxxxxxxxxxxxxxx`

## Security Best Practices

1. **Never commit .env files to Git**
2. **Use environment variables for sensitive data**
3. **Regularly rotate your API keys**
4. **Limit API key permissions when possible**

## Troubleshooting

### Check if environment variables are loaded:
```bash
curl -X GET http://159.89.166.91:3002/api/status
```

### Check PM2 logs:
```bash
pm2 logs jarvis-api
```

### Restart the application:
```bash
pm2 restart jarvis-api
```

## Automated Deployment

Use the provided scripts to make deployment easier:

1. **deploy-setup.bat** - Windows script to create environment template
2. **deploy-setup.sh** - Linux script to create environment template
3. **github-upload.bat** - Deploy code to GitHub

## Next Steps

1. Set up your API keys as described above
2. Test the API endpoint
3. Use the github-upload.bat script for future deployments
4. Monitor your application with PM2

Your JARVIS API should now be fully functional on DigitalOcean!
