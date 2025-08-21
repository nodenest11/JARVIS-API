# JARVIS AI API - MVP

A production-ready AI API with intelligent web search capabilities powered by Gemini AI.

## 🚀 Features

- **Intelligent Decision Making**: Gemini AI decides when to use web search vs AI-only responses
- **Multi-Provider AI**: Support for GitHub OpenAI, Groq, OpenRouter, and Google Gemini
- **Web Search Integration**: Real-time web search for current information
- **Hybrid Responses**: Combines AI knowledge with web data
- **Production Ready**: Optimized performance and error handling

## 🛠️ Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Environment Variables**
   ```bash
   # Create .env file with your API keys
   NODE_ENV=development
   PORT=3002
   GROQ_API_KEY=your_groq_key
   GITHUB_TOKEN=your_github_token
   OPENROUTER_API_KEY=your_openrouter_key
   GEMINI_API_KEY=your_gemini_key
   ```

3. **Start the Server**
   ```bash
   npm start
   ```

4. **Test the API**
   ```bash
   curl -X POST http://localhost:3002/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "What is the current weather in New York?"}'
   ```

## 📚 API Endpoints

### POST /api/chat
Main chat endpoint with intelligent web search.

**Request:**
```json
{
  "message": "Your question here",
  "hybridMode": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "AI response with optional web data",
    "provider": "GitHub OpenAI",
    "webSearchUsed": true,
    "metadata": {
      "decisionReasoning": "Why web search was/wasn't used"
    }
  }
}
```

### GET /api/status
Health check and service status.

## 🧠 How It Works

1. **Query Analysis**: Gemini AI analyzes if the query needs real-time web data
2. **Decision Making**: Intelligent decision based on content, not keywords
3. **Response Strategy**: Either AI-only or AI+Web hybrid response
4. **Web Search**: When needed, searches web and combines with AI analysis

## 🎯 Decision Logic

**Web Search Triggered For:**
- Current/live data (weather, stock prices, news)
- Recent events or updates
- Real-time information (today's date, current status)
- Specific business info (hours, contact, prices)

**AI-Only For:**
- General knowledge questions
- Historical facts
- Programming help
- Mathematical concepts
- Creative writing

## 📁 Project Structure

```
src/
├── config/         # Configuration management
├── middleware/     # Request validation
├── routes/         # API endpoints
├── services/       # Core business logic
│   ├── aiServiceManager.js       # AI provider management
│   ├── hybridAIService.js        # Hybrid response logic
│   ├── intelligentDecisionAgent.js # Gemini decision making
│   └── webScrapingService.js     # Web search integration
└── utils/          # Helpers and utilities
```

## 🔧 Configuration

The system automatically manages:
- Service priority and failover
- Performance optimization
- Error handling and retries
- Intelligent caching

## 📊 Monitoring

- Real-time logs in `logs/` directory
- Status endpoint for health checks
- Performance metrics in responses

## 🚢 Production Deployment

1. Set `NODE_ENV=production`
2. Configure environment variables
3. Ensure web scraping service is running on port 8000
4. Start with `npm start`

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ for intelligent AI assistance**
