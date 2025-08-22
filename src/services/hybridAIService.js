import IntelligentDecisionAgent from './intelligentDecisionAgent.js';
import WebScrapingService from './webScrapingService.js';
import { logger } from '../utils/logger.js';

class HybridAIService {
    constructor(aiServiceManager) {
        this.aiServiceManager = aiServiceManager;
        this.webService = new WebScrapingService();
        this.decisionAgent = new IntelligentDecisionAgent();
        this.webServiceAvailable = null;
    }

    async generateResponse(userMessage, options = {}) {
        const startTime = Date.now();
        
        if (this.webServiceAvailable === null) {
            this.webServiceAvailable = await this.webService.isAvailable();
        }

        const analysis = await this.decisionAgent.analyzeQuery(userMessage);
        const shouldUseWeb = analysis.needsWebSearch && this.webServiceAvailable;
        
        let response;
        
        if (shouldUseWeb) {
            response = await this.generateHybridResponse(userMessage, analysis, options);
        } else {
            response = await this.generateAIOnlyResponse(userMessage, analysis, options);
        }

        const totalTime = Date.now() - startTime;
        response.metadata.totalResponseTime = totalTime;
        response.metadata.webSearchUsed = shouldUseWeb;
        response.metadata.decisionReasoning = analysis.reasoning;

        return response;
    }

    async generateHybridResponse(userMessage, analysis, options) {
        try {
            const searchQuery = analysis.searchQuery || userMessage;
            const webResults = await this.webService.search(searchQuery);
            
            const hybridPrompt = this.createHybridPrompt(userMessage, webResults, analysis);
            const aiResponse = await this.aiServiceManager.generatePureAIResponse(hybridPrompt, options);
            
            return this.formatHybridResponse(aiResponse, webResults, analysis);
        } catch (error) {
            logger.warn('Web search failed, falling back to AI only', { error: error.message });
            return this.generateAIOnlyResponse(userMessage, analysis, options);
        }
    }

    async generateAIOnlyResponse(userMessage, analysis, options) {
        const response = await this.aiServiceManager.generatePureAIResponse(userMessage, options);
        response.metadata = response.metadata || {};
        response.metadata.responseType = 'ai_only';
        response.metadata.analysisConfidence = Math.round(analysis.confidence * 100);
        response.metadata.webSearchReason = analysis.reasoning;
        return response;
    }

    createHybridPrompt(userMessage, webResults, analysis) {
        if (!webResults.success || !webResults.data.sources.length) {
            return userMessage;
        }

        const sources = webResults.data.sources.slice(0, 3);
        const webInfo = sources.map(source => source.snippet).join('\n');

        return `Answer this question naturally and directly: ${userMessage}

Current information:
${webInfo}

IMPORTANT: Provide a clean, direct answer as if you naturally know this information. Do not mention sources, websites, or that you searched for this information. Just give the answer normally like a human would.`;
    }

    formatHybridResponse(aiResponse, webResults, analysis) {
        return {
            ...aiResponse,
            webData: {
                searchQuery: webResults.data.searchQuery,
                searchEngine: webResults.data.searchEngine,
                totalResults: webResults.data.totalResults,
                searchTime: webResults.data.searchTime,
                sources: webResults.data.sources,
                relatedQuestions: webResults.data.relatedQuestions || []
            },
            metadata: {
                ...aiResponse.metadata,
                responseType: 'hybrid_web_ai',
                webSearchUsed: true,
                searchStrategy: 'search_only',
                analysisConfidence: Math.round(analysis.confidence * 100),
                webSourcesCount: webResults.data.sources.length,
                hasScrapedContent: false
            }
        };
    }
}

export default HybridAIService;
