import { logger } from '../utils/logger.js';

class IntelligentDecisionAgent {
    constructor() {
        this.geminiApiKey = process.env.GEMINI_API_KEY || 'AIzaSyA9nbBPMQy34YYJh6uftKS8tsqxEJUPC8Y';
        this.client = null;
        this.isInitialized = false;
        this.initialize();
    }

    async initialize() {
        try {
            const { GoogleGenerativeAI } = await import('@google/generative-ai');
            this.client = new GoogleGenerativeAI(this.geminiApiKey);
            this.model = this.client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
            this.isInitialized = true;
            logger.info('Decision agent initialized with Gemini');
        } catch (error) {
            logger.error('Failed to initialize decision agent', { error: error.message });
            this.isInitialized = false;
        }
    }

    async analyzeQuery(userMessage) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.client || !this.model) {
            return this.createDefaultResponse(userMessage, 'Service unavailable');
        }

        const decisionPrompt = this.buildDecisionPrompt(userMessage);

        try {
            const result = await this.model.generateContent({
                contents: [{ role: 'user', parts: [{ text: decisionPrompt }] }],
                generationConfig: {
                    temperature: 0.1,
                    topK: 1,
                    topP: 0.8,
                    maxOutputTokens: 150,
                }
            });

            const responseText = result.response.text();
            return this.processDecision(responseText, userMessage);

        } catch (error) {
            logger.error('Decision analysis failed', { 
                error: error.message,
                query: userMessage.substring(0, 50)
            });
            return this.createDefaultResponse(userMessage, 'Analysis failed');
        }
    }

    buildDecisionPrompt(query) {
        return `CRITICAL DECISION: Only use web search if this query ABSOLUTELY requires CURRENT/LIVE data that changes frequently.

QUERY: "${query}"

STRICT RULES - Use web search ONLY for:
1. Current date/time: "what date is today", "current time"
2. Live weather: "weather now", "temperature today"
3. Breaking news: "latest news", "what happened today"
4. Live prices: "current stock price", "bitcoin price now"
5. Real-time status: "website down", "server status"

DO NOT use web search for:
- Programming questions, tutorials, code help
- Explanations, definitions, concepts
- Math, calculations, problem solving
- Historical information, past events
- General knowledge questions
- How-to guides, tutorials
- Creative writing, analysis
- Technical documentation
- Product information (unless asking for current pricing)

BE EXTREMELY CONSERVATIVE. When in doubt, choose AI knowledge.

Return JSON with confidence 0.9+ ONLY if absolutely certain web search is needed:
{
  "needsWebSearch": true/false,
  "confidence": 0.0-1.0,
  "reasoning": "explain why web search is/isn't needed",
  "searchQuery": "search terms only if web search needed"
}`;
    }

    processDecision(responseText, originalQuery) {
        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                return this.createDefaultResponse(originalQuery, 'Invalid response format');
            }

            const decision = JSON.parse(jsonMatch[0]);
            
            const analysis = {
                needsWebSearch: Boolean(decision.needsWebSearch),
                confidence: this.normalizeConfidence(decision.confidence),
                reasoning: decision.reasoning || 'AI analysis',
                searchQuery: decision.needsWebSearch ? (decision.searchQuery || originalQuery) : ''
            };

            // STRICT VALIDATION: Only allow web search with very high confidence
            if (analysis.needsWebSearch && analysis.confidence < 0.85) {
                analysis.needsWebSearch = false;
                analysis.reasoning = `Confidence too low (${analysis.confidence}) - using AI only`;
                analysis.searchQuery = '';
            }

            // Additional safety check: look for obvious AI-only patterns
            if (analysis.needsWebSearch && this.isObviousAIQuery(originalQuery)) {
                analysis.needsWebSearch = false;
                analysis.reasoning = 'Detected general knowledge query - using AI only';
                analysis.searchQuery = '';
            }

            this.logDecision(originalQuery, analysis);
            return analysis;

        } catch (error) {
            logger.warn('Failed to parse decision response', { 
                error: error.message,
                response: responseText.substring(0, 100)
            });
            return this.createDefaultResponse(originalQuery, 'Parse error');
        }
    }

    isObviousAIQuery(query) {
        const lowerQuery = query.toLowerCase();
        const aiOnlyPatterns = [
            'how to', 'what is', 'explain', 'define', 'tutorial', 'example',
            'help me', 'write code', 'debug', 'create', 'generate', 'solve',
            'calculate', 'algorithm', 'programming', 'function', 'method',
            'difference between', 'advantages', 'disadvantages', 'compare'
        ];
        
        return aiOnlyPatterns.some(pattern => lowerQuery.includes(pattern));
    }

    normalizeConfidence(value) {
        const confidence = parseFloat(value);
        if (isNaN(confidence)) return 0.5;
        return Math.max(0.0, Math.min(1.0, confidence));
    }

    createDefaultResponse(query, reason) {
        // Always default to AI-only when there's any uncertainty
        return {
            needsWebSearch: false,
            confidence: 0.9, // High confidence in using AI only
            reasoning: `${reason} - defaulting to AI knowledge (safe choice)`,
            searchQuery: ''
        };
    }

    logDecision(query, analysis) {
        logger.info('Decision made', {
            query: query.substring(0, 40) + '...',
            decision: analysis.needsWebSearch ? 'WEB_SEARCH' : 'AI_ONLY',
            confidence: analysis.confidence,
            reasoning: analysis.reasoning
        });
    }
}

export default IntelligentDecisionAgent;
