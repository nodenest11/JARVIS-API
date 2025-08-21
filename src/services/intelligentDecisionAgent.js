import { logger } from '../utils/logger.js';

class IntelligentDecisionAgent {
    constructor() {
        this.geminiApiKey = 'AIzaSyA9nbBPMQy34YYJh6uftKS8tsqxEJUPC8Y';
        this.geminiClient = null;
        this.initializeGemini().catch(error => {
            logger.error('Gemini init failed', { error: error.message });
        });
    }

    async initializeGemini() {
        const { default: OpenAI } = await import('openai');
        this.geminiClient = new OpenAI({
            apiKey: this.geminiApiKey,
            baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
            maxRetries: 2
        });
        logger.info('Gemini initialized');
    }

    async analyzeQuery(userMessage) {
        if (!this.geminiClient) await this.initializeGemini();

        const analysisPrompt = `Decide if this query needs web search: "${userMessage}"

WEB SEARCH NEEDED: current data, news, weather, prices, recent events
AI ONLY: definitions, how-to, programming, math, history

JSON response: {"needsWebSearch": true/false, "confidence": 0.0-1.0, "reasoning": "brief reason", "searchQuery": "if needed"}`;

        try {
            const response = await this.geminiClient.chat.completions.create({
                messages: [{ role: 'user', content: analysisPrompt }],
                model: 'gemini-2.0-flash-exp',
                temperature: 0.1,
                max_tokens: 200
            });

            return this.parseAnalysis(response.choices[0].message.content);
        } catch (error) {
            logger.error('Gemini failed', { error: error.message });
            return { needsWebSearch: false, confidence: 0.3, reasoning: 'Gemini unavailable', searchQuery: '' };
        }
    }

    parseAnalysis(response) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            const analysis = JSON.parse(jsonMatch[0]);
            return {
                needsWebSearch: !!analysis.needsWebSearch,
                confidence: Math.min(Math.max(analysis.confidence || 0.5, 0), 1),
                reasoning: analysis.reasoning || 'AI decision',
                searchQuery: analysis.searchQuery || ''
            };
        } catch (error) {
            return { needsWebSearch: false, confidence: 0.3, reasoning: 'Parse error', searchQuery: '' };
        }
    }
}

export default IntelligentDecisionAgent;
