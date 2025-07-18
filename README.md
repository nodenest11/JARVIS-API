# 🤖 JARVIS API - Professional Multi-Provider AI Assistant

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/Pratham200Rajbhar/JARVIS-API)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node.js-18%2B-brightgreen.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/express-4.21.2-lightgrey.svg)](https://expressjs.com/)

**JARVIS API** is a professional, enterprise-grade AI assistant API that provides intelligent responses through multiple AI providers with automatic fallback mechanisms. Built with Node.js and Express, it offers a simple yet powerful interface for AI-powered applications.

## 🌟 Key Features

### 🚀 **Multi-Provider Support**

- **Groq** - Ultra-fast Llama 4 Scout responses
- **GitHub OpenAI** - High-quality GPT-4o intelligence
- **OpenRouter** - Access to multiple open-source models
- **Google Gemini** - Advanced reasoning capabilities

### 🎯 **Intelligent Fallback System**

- Automatic provider switching on failures
- Priority-based model selection
- Retry mechanisms with exponential backoff
- No service interruption

### ⚙️ **Dynamic Configuration**

- Real-time model priority changes via `priority.json`
- No server restart required
- Easy model switching and management
- Custom provider settings

### 🔒 **Enterprise Features**

- Professional error handling
- Comprehensive logging system
- Rate limiting protection
- CORS security
- Request validation

### 🎨 **Professional UI**

- Admin dashboard
- Interactive chat interface
- Real-time documentation
- System monitoring

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- AI provider API keys

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Pratham200Rajbhar/JARVIS-API.git
   cd JARVIS-API
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your API keys:

   ```env
   # Required API Keys
   GROQ_API_KEY=your_groq_api_key_here
   GITHUB_TOKEN=your_github_token_here
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here

   # Server Configuration
   PORT=3000
   NODE_ENV=production
   ```

4. **Start the server**

   ```bash
   npm start
   ```

5. **Access the services**
   - **API Endpoint**: `http://localhost:3000/api/chat`
   - **Admin Panel**: `http://localhost:3000/jarvis`
   - **Chat Interface**: `http://localhost:3000/jarvis/chat`
   - **Documentation**: `http://localhost:3000/docs`

## 📡 API Usage

### Simple Chat Request

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how can you help me?"}'
```

### Response Format

```json
{
  "success": true,
  "timestamp": "2025-07-17T12:00:00.000Z",
  "data": {
    "response": "Hello! I'm JARVIS, your AI assistant...",
    "provider": "Groq",
    "model": "meta-llama/llama-4-scout-17b-16e-instruct",
    "fallbackUsed": false,
    "totalAttempts": 1,
    "responseTime": 1250,
    "settings": {
      "noTimeoutRestrictions": true,
      "noTokenLimits": true,
      "allowCompleteResponse": true
    }
  }
}
```

## ⚙️ Configuration

### Priority Management

Edit `priority.json` to change AI model priorities:

```json
{
  "providers": [
    {
      "id": "groq",
      "name": "Groq",
      "model": "meta-llama/llama-4-scout-17b-16e-instruct",
      "priority": 1,
      "enabled": true,
      "description": "Fastest AI model with Llama 4 Scout"
    },
    {
      "id": "github",
      "name": "GitHub OpenAI",
      "model": "gpt-4o",
      "priority": 2,
      "enabled": true,
      "description": "High quality responses with GPT-4o"
    }
  ]
}
```

**Key Features:**

- **Real-time updates** - No server restart required
- **Priority ordering** - Lower numbers = higher priority
- **Enable/disable** - Toggle providers on/off
- **Model selection** - Choose specific models per provider

### Environment Variables

| Variable             | Description                          | Required |
| -------------------- | ------------------------------------ | -------- |
| `GROQ_API_KEY`       | Groq API key for Llama models        | Yes      |
| `GITHUB_TOKEN`       | GitHub token for OpenAI access       | Yes      |
| `OPENROUTER_API_KEY` | OpenRouter API key                   | Yes      |
| `GEMINI_API_KEY`     | Google Gemini API key                | Yes      |
| `PORT`               | Server port (default: 3000)          | No       |
| `NODE_ENV`           | Environment (production/development) | No       |

## 🏗️ Project Structure

```
JARVIS-API/
├── 📁 public/                 # Web UI files
│   ├── admin.html            # Admin dashboard
│   ├── jarvis.html           # Chat interface
│   └── docs.html             # Documentation
├── 📁 src/
│   ├── 📁 config/            # Configuration files
│   │   ├── config.js         # Main configuration
│   │   └── constants.js      # System constants
│   ├── 📁 middleware/        # Express middleware
│   │   └── index.js          # Request validation & logging
│   ├── 📁 routes/            # API routes
│   │   ├── api.js            # Main API endpoints
│   │   └── admin.js          # Admin endpoints
│   ├── 📁 services/          # AI service providers
│   │   ├── aiServiceManager.js    # Service orchestration
│   │   ├── groqService.js         # Groq integration
│   │   ├── githubOpenAIService.js # GitHub OpenAI
│   │   ├── openRouterService.js   # OpenRouter
│   │   ├── geminiService.js       # Google Gemini
│   │   └── priorityService.js     # Priority management
│   └── 📁 utils/             # Utility functions
│       ├── helpers.js        # Common helpers
│       └── logger.js         # Logging system
├── index.js                  # Main server file
├── priority.json             # AI model priorities
├── package.json              # Dependencies
├── .env.example              # Environment template
└── README.md                 # This file
```

## 🔧 Available Endpoints

### Core API

- `POST /api/chat` - Main chat endpoint
- `GET /api/status` - System status check
- `GET /api/test` - API health test

### Admin Interface

- `GET /jarvis` - Admin dashboard
- `GET /jarvis/chat` - Interactive chat
- `GET /docs` - API documentation
- `GET /logs` - System logs

### Health & Monitoring

- `GET /health` - Health check
- `GET /healthy` - Alias for health check
- `GET /` - API information

## 🛠️ Development

### Available Scripts

```bash
# Start production server
npm start

# Start development server
npm run dev

# Run tests
npm test
```

### Adding New AI Providers

1. Create service file in `src/services/`
2. Extend `BaseAIService` class
3. Add provider configuration to `priority.json`
4. Update environment variables

Example service structure:

```javascript
import BaseAIService from "./BaseAIService.js";

export default class NewAIService extends BaseAIService {
  constructor() {
    super("newai");
  }

  async generateResponse(message) {
    // Implementation
  }
}
```

## 📊 Monitoring & Logging

### Console Logging Features

- 🚀 Server startup information
- 📝 Request/response tracking
- 🤖 AI provider usage
- ⚠️ Error notifications
- ✅ Success confirmations

### Log Format Examples

```
🚀 JARVIS AI API Server running on port 3000
🤖✅ Groq (meta-llama/llama-4-scout-17b-16e-instruct) → SUCCESS (1250ms)
✅ POST /api/chat → 200 (1252ms)
⚠️ POST /api/chat → 400 (1ms)
```

## 🚀 Deployment

### Using the Deployment Script

Run the included deployment script:

```bash
./github-upload.bat
```

This will:

1. Check git status
2. Add all changes
3. Commit with custom message
4. Push to GitHub

### Manual Deployment

```bash
# Build and deploy
git add .
git commit -m "Deploy JARVIS API v2.0.0"
git push origin main

# Or deploy to specific branch
git push origin feature-branch
```

### Production Considerations

- Set `NODE_ENV=production`
- Configure proper logging
- Enable HTTPS
- Set up monitoring
- Configure rate limiting
- Use process managers (PM2)

## 🔐 Security Features

- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Sanitizes all inputs
- **Error Sanitization**: Prevents information leakage
- **CORS Protection**: Configurable cross-origin rules
- **Environment Variables**: Secure API key management

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/Pratham200Rajbhar/JARVIS-API/issues)
- **Documentation**: Built-in docs at `/docs`
- **Admin Panel**: Monitor system at `/jarvis`

## 🎯 Roadmap

- [ ] WebSocket support for real-time chat
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Custom model fine-tuning
- [ ] Plugin system for extensions
- [ ] Database integration
- [ ] Authentication system
- [ ] Docker containerization

## 📈 Performance

- **Response Time**: < 2 seconds average
- **Availability**: 99.9% uptime with fallback
- **Throughput**: 100 requests/minute (configurable)
- **Memory**: < 100MB RAM usage
- **CPU**: Minimal CPU footprint

---

<div align="center">

**Built with ❤️ by [Pratham200Rajbhar](https://github.com/Pratham200Rajbhar)**

⭐ Star this repository if you find it helpful!

</div>

## 🚀 Performance Optimizations

The JARVIS API has been optimized for production performance with the following enhancements:

### Server Optimizations

- **Compression middleware** - Reduces response size and improves load times
- **Lazy initialization** - Services are only initialized when needed
- **Memory management** - Configurable memory limits and garbage collection
- **Cluster mode** - Utilizes all available CPU cores for maximum throughput
- **Response caching** - Frequently accessed endpoints use in-memory caching
- **Conditional logging** - Minimal logging in production for better performance

### Code Optimizations

- **Efficient error handling** - Streamlined error responses with proper status codes
- **Reduced dependencies** - Minimal external dependencies for faster startup
- **Static file caching** - Long-lived cache headers for static assets
- **Configuration caching** - Avoids repeated environment variable lookups
- **Rate limiting** - In-memory rate limiting with efficient cleanup
- **Buffer-based logging** - Reduces disk I/O by batching log writes

### Deployment Tools

- **PM2 ecosystem** - Optimized cluster deployment with auto-restart
- **Deployment scripts** - Easy setup and maintenance with `deploy-setup.sh`
- **Server optimization** - System-level optimizations with `server-fix.sh`
- **Memory auto-scaling** - Automatically adjusts memory limits based on system resources

### Production Best Practices

- **Environment-specific settings** - Different configurations for development and production
- **Security headers** - Proper CORS and security headers
- **Graceful shutdown** - Proper handling of process termination
- **Monitoring** - Built-in health checks and status endpoints

To deploy the optimized version, use the provided deployment scripts:

```bash
# Setup the server environment
sudo ./server-fix.sh

# Deploy the application
./deploy-setup.sh

# Start the application
./deploy-setup.sh --start
```
