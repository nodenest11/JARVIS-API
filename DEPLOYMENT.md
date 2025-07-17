# 🌊 DigitalOcean Deployment Guide

## 📋 Prerequisites

- DigitalOcean Droplet with Node.js 18+
- PM2 installed globally: `npm install -g pm2`
- Git installed on the server

## 🚀 Deployment Steps

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Clone your repository
git clone https://github.com/Pratham200Rajbhar/JARVIS-API.git
cd JARVIS-API
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

**Required Environment Variables:**

```env
NODE_ENV=production
PORT=3002
BASE_URL=http://your-domain.com:3002

# API Keys
GROQ_API_KEY=your_groq_api_key
GITHUB_TOKEN=your_github_token
OPENROUTER_API_KEY=your_openrouter_key
GEMINI_API_KEY=your_gemini_key
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start with PM2

```bash
# Start using PM2 configuration
pm2 start ecosystem.config.json

# Or start manually
pm2 start index.js --name "jarvis-api" --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

### 5. Configure Firewall

```bash
# Allow the port through firewall
sudo ufw allow 3002/tcp

# Enable firewall if not already enabled
sudo ufw enable
```

### 6. Setup Nginx (Optional - Recommended)

```bash
# Install Nginx
sudo apt install nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/jarvis-api
```

**Nginx Configuration:**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/jarvis-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔧 Port Configuration

### Changing the Port

1. **Update .env file:**

   ```env
   PORT=3002
   BASE_URL=http://your-domain.com:3002
   ```

2. **Update PM2 configuration (ecosystem.config.json):**

   ```json
   {
     "apps": [
       {
         "name": "jarvis-api",
         "env": {
           "PORT": 3002
         }
       }
     ]
   }
   ```

3. **Restart the application:**

   ```bash
   pm2 restart jarvis-api
   ```

4. **Update firewall rules:**

   ```bash
   sudo ufw allow 3002/tcp
   sudo ufw delete allow 3000/tcp  # Remove old port if needed
   ```

5. **Update Nginx configuration if using proxy:**
   ```nginx
   proxy_pass http://localhost:3002;
   ```

## 📊 Monitoring

### PM2 Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs jarvis-api

# Monitor resources
pm2 monit

# Restart application
pm2 restart jarvis-api

# Stop application
pm2 stop jarvis-api
```

### Health Check

```bash
# Check if API is running
curl http://localhost:3002/health

# Check API endpoints
curl http://localhost:3002/
```

## 🛠️ Troubleshooting

### Common Issues

1. **Port already in use:**

   ```bash
   sudo lsof -i :3002
   sudo kill -9 <PID>
   ```

2. **Permission denied:**

   ```bash
   sudo chown -R $USER:$USER /path/to/JARVIS-API
   ```

3. **Environment variables not loading:**

   ```bash
   # Check if .env file exists and has correct permissions
   ls -la .env
   chmod 600 .env
   ```

4. **API not accessible from outside:**

   ```bash
   # Check firewall
   sudo ufw status

   # Check if server is binding to correct interface
   netstat -tlnp | grep :3002
   ```

### Logs Location

- **PM2 logs:** `~/.pm2/logs/`
- **Application logs:** Check PM2 logs or console output
- **Nginx logs:** `/var/log/nginx/`

## 🔄 Updates

### Updating the Application

```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Restart with PM2
pm2 restart jarvis-api
```

### Automatic Updates

You can set up a webhook or cron job to automatically update the application when changes are pushed to the repository.

## 🔐 Security Best Practices

1. **Keep .env file secure:**

   ```bash
   chmod 600 .env
   ```

2. **Use environment variables for sensitive data**
3. **Keep dependencies updated:**

   ```bash
   npm audit fix
   ```

4. **Use HTTPS in production**
5. **Set up proper firewall rules**
6. **Monitor logs regularly**

## 📞 Support

If you encounter issues:

1. Check the logs: `pm2 logs jarvis-api`
2. Verify configuration: `npm run start` (to see validation errors)
3. Check firewall settings
4. Ensure all environment variables are set correctly
