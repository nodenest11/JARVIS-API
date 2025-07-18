#!/bin/bash
# Optimized Production Deployment Script for JARVIS API on DigitalOcean

# Exit on error
set -e

# Display help message
show_help() {
  echo "JARVIS API Production Deployment Script for DigitalOcean"
  echo "Usage: ./deploy-setup.sh [options]"
  echo ""
  echo "Options:"
  echo "  --help                Show this help message"
  echo "  --install-deps        Install system dependencies"
  echo "  --setup-env           Create .env file"
  echo "  --start               Start the application"
  echo "  --restart             Restart the application"
  echo "  --stop                Stop the application"
  echo "  --logs                View application logs"
  echo "  --setup-nginx         Setup Nginx as reverse proxy"
  echo ""
}

# Install system dependencies
install_dependencies() {
  echo "📦 Installing system dependencies..."
  
  # Check if Node.js is installed
  if ! command -v node &> /dev/null; then
    echo "Node.js not found. Installing Node.js 18.x..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
  else
    echo "✅ Node.js is already installed: $(node -v)"
  fi
  
  # Check if PM2 is installed
  if ! command -v pm2 &> /dev/null; then
    echo "PM2 not found. Installing PM2 globally..."
    sudo npm install -g pm2
  else
    echo "✅ PM2 is already installed: $(pm2 -v)"
  fi
  
  # Install project dependencies
  echo "📦 Installing project dependencies..."
  npm ci --production
  
  echo "✅ All dependencies installed successfully!"
}

# Setup environment variables
setup_env() {
  echo "🔧 Setting up environment variables..."
  
  if [ -f .env ]; then
    echo "⚠️ .env file already exists. Do you want to overwrite it? (y/n)"
    read -r overwrite
    if [[ $overwrite != "y" ]]; then
      echo "❌ Aborted .env creation."
      return
    fi
  fi
  
  # Get the server's public IP
  SERVER_IP=$(curl -s http://checkip.amazonaws.com || curl -s http://ifconfig.me)
  
  cat > .env << EOF
# JARVIS API Environment Configuration for DigitalOcean
# Production settings

# Server Configuration
NODE_ENV=production
PORT=3002
DIGITAL_OCEAN_IP=${SERVER_IP}

# API Keys - REQUIRED
GROQ_API_KEY=your_groq_api_key_here
GITHUB_TOKEN=your_github_token_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Logging Configuration
LOG_LEVEL=warn
EOF
  
  echo "✅ .env file created successfully!"
  echo "⚠️ Please edit the .env file to add your API keys before starting the application."
}

# Start application
start_app() {
  echo "🚀 Starting JARVIS API in production mode..."
  
  # Create logs directory if it doesn't exist
  mkdir -p logs
  
  # Start with PM2
  pm2 start ecosystem.config.json --env production
  
  # Save PM2 process list
  pm2 save
  
  # Setup PM2 to start on system boot
  echo "Setting up PM2 to start on system boot..."
  pm2 startup
  
  echo "✅ JARVIS API started successfully in production mode!"
  
  # Get the server's public IP
  SERVER_IP=$(curl -s http://checkip.amazonaws.com || curl -s http://ifconfig.me)
  echo "📊 View dashboard at http://${SERVER_IP}:3002/jarvis"
  echo "💬 View chat interface at http://${SERVER_IP}:3002/jarvis/chat"
}

# Restart application
restart_app() {
  echo "🔄 Restarting JARVIS API..."
  pm2 reload jarvis-api
  echo "✅ JARVIS API restarted successfully!"
}

# Stop application
stop_app() {
  echo "⏹️ Stopping JARVIS API..."
  pm2 stop jarvis-api
  echo "✅ JARVIS API stopped successfully!"
}

# View logs
view_logs() {
  echo "📋 Viewing JARVIS API logs..."
  pm2 logs jarvis-api
}

# Setup Nginx as reverse proxy
setup_nginx() {
  echo "🔧 Setting up Nginx as reverse proxy..."
  
  # Check if Nginx is installed
  if ! command -v nginx &> /dev/null; then
    echo "Nginx not found. Installing Nginx..."
    sudo apt-get update
    sudo apt-get install -y nginx
  else
    echo "✅ Nginx is already installed"
  fi
  
  # Create Nginx configuration
  sudo cat > /etc/nginx/sites-available/jarvis-api << EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
  
  # Enable the site
  sudo ln -sf /etc/nginx/sites-available/jarvis-api /etc/nginx/sites-enabled/
  
  # Test Nginx configuration
  sudo nginx -t
  
  # Restart Nginx
  sudo systemctl restart nginx
  
  # Get the server's public IP
  SERVER_IP=$(curl -s http://checkip.amazonaws.com || curl -s http://ifconfig.me)
  
  echo "✅ Nginx setup completed!"
  echo "🌐 Your API is now accessible at http://${SERVER_IP}"
  echo "📊 Admin dashboard: http://${SERVER_IP}/jarvis"
  echo "💬 Chat interface: http://${SERVER_IP}/jarvis/chat"
}

# Main script logic
case "$1" in
  --help)
    show_help
    ;;
  --install-deps)
    install_dependencies
    ;;
  --setup-env)
    setup_env
    ;;
  --start)
    start_app
    ;;
  --restart)
    restart_app
    ;;
  --stop)
    stop_app
    ;;
  --logs)
    view_logs
    ;;
  --setup-nginx)
    setup_nginx
    ;;
  *)
    echo "🔧 Running full setup..."
    install_dependencies
    setup_env
    echo ""
    echo "✅ Setup completed successfully!"
    echo "⚠️ Please edit the .env file to add your API keys before starting the application."
    echo "🚀 To start the application, run: ./deploy-setup.sh --start"
    echo "🌐 To setup Nginx as a reverse proxy, run: ./deploy-setup.sh --setup-nginx"
    ;;
esac
