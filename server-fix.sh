#!/bin/bash
# Server Optimization Script for JARVIS API on DigitalOcean

# Exit on error
set -e

echo "🔧 JARVIS API Server Optimization Script for DigitalOcean"
echo "========================================================"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "⚠️  Please run as root or with sudo"
  exit 1
fi

echo "📊 Running system diagnostics..."
echo ""

# System information
echo "System Information:"
echo "-------------------"
uname -a
echo ""

# CPU info
echo "CPU Information:"
echo "---------------"
lscpu | grep -E 'Model name|Socket|Thread|CPU\(s\)|MHz'
echo ""

# Memory info
echo "Memory Information:"
echo "------------------"
free -h
echo ""

# Disk space
echo "Disk Space:"
echo "-----------"
df -h /
echo ""

echo "🔧 Applying system optimizations for DigitalOcean..."

# Create swap if none exists and memory is less than 2GB
total_mem=$(free -m | awk '/^Mem:/{print $2}')
if [ $total_mem -lt 2048 ] && [ ! -f /swapfile ]; then
  echo "Creating 2GB swap file..."
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "✅ Swap file created and enabled"
fi

# Set Node.js memory limits in ecosystem.config.json
echo "Setting Node.js memory limits..."
if [ -f ecosystem.config.json ]; then
  # Backup the original file
  cp ecosystem.config.json ecosystem.config.json.bak
  
  # Calculate memory limit based on system memory (50% of total memory)
  mem_limit=$((total_mem / 2))
  if [ $mem_limit -lt 512 ]; then
    mem_limit=512
  fi
  
  echo "Setting memory limit to ${mem_limit}M"
  sed -i "s/\"max_memory_restart\": \"[0-9]*[MG]\"/\"max_memory_restart\": \"${mem_limit}M\"/g" ecosystem.config.json
fi

# Optimize Node.js for production
echo "Optimizing Node.js for production..."
if [ -f package.json ]; then
  # Backup the original file
  cp package.json package.json.bak
  
  # Update production script with optimizations
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (pkg.scripts && pkg.scripts.prod) {
      pkg.scripts.prod = 'NODE_ENV=production node --optimize_for_size --max_old_space_size=${mem_limit} index.js';
      fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    }
  "
fi

# Create logs directory with proper permissions
echo "Setting up logs directory..."
mkdir -p logs
chmod 755 logs

# Get server IP
SERVER_IP=$(curl -s http://checkip.amazonaws.com || curl -s http://ifconfig.me)

# Create .env if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating default .env file for DigitalOcean..."
  cat > .env << EOF
# JARVIS API Environment Configuration for DigitalOcean
# Production settings

# Server Configuration
NODE_ENV=production
PORT=3002
DIGITAL_OCEAN_IP=${SERVER_IP}

# API Keys - REQUIRED
# Please add your API keys here
GROQ_API_KEY=
GITHUB_TOKEN=
OPENROUTER_API_KEY=
GEMINI_API_KEY=

# Logging Configuration
LOG_LEVEL=warn
EOF
  echo "⚠️ Please edit the .env file to add your API keys"
fi

# Set proper file permissions
echo "Setting proper file permissions..."
find . -type f -name "*.js" -exec chmod 644 {} \;
find . -type f -name "*.json" -exec chmod 644 {} \;
find . -type f -name "*.html" -exec chmod 644 {} \;
find . -type f -name "*.css" -exec chmod 644 {} \;
chmod 755 *.sh

# Open firewall for port 3002
echo "Configuring firewall for port 3002..."
if command -v ufw &> /dev/null; then
  ufw allow 3002/tcp
  echo "✅ Firewall configured to allow port 3002"
fi

# Configure system limits for high performance
echo "Configuring system limits for high performance..."
if [ ! -f /etc/security/limits.d/nofile.conf ]; then
  cat > /etc/security/limits.d/nofile.conf << EOF
# Increase file descriptor limits for Node.js
*         soft    nofile      65535
*         hard    nofile      65535
root      soft    nofile      65535
root      hard    nofile      65535
EOF
  echo "✅ File descriptor limits increased"
fi

# Optimize network settings
echo "Optimizing network settings..."
cat >> /etc/sysctl.conf << EOF

# Optimize network settings for high-performance web server
net.core.somaxconn = 65535
net.ipv4.tcp_max_tw_buckets = 1440000
net.ipv4.ip_local_port_range = 1024 65535
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_max_syn_backlog = 3240000
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_slow_start_after_idle = 0
EOF

# Apply sysctl settings
sysctl -p

echo ""
echo "✅ Server optimization completed for DigitalOcean!"
echo ""
echo "🚀 To start the server, run:"
echo "    ./deploy-setup.sh --start"
echo ""
echo "📊 To monitor the server, run:"
echo "    pm2 monit"
echo ""
echo "🌐 Your server IP is: ${SERVER_IP}"
echo "   API will be accessible at: http://${SERVER_IP}:3002"
echo ""
