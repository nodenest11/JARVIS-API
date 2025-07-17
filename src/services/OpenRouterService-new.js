/**
 * OpenRouter Service Implementation
 */

import fetch from 'node-fetch';
import { BaseAIService } from './BaseAIService.js';
import { CONFIG } from '../config/config.js';

class OpenRouterService extends BaseAIService {
    constructor() {
        super(CONFIG.PROVIDERS.OPENROUTER);
    }

    async createClient() {
        // OpenRouter uses fetch, no client initialization needed
        this.client = {
            endpoint: this.config.baseURL + '/chat/completions',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': CONFIG.SERVER.BASE_URL,
                'X-Title': 'JARVIS AI API'
            }
        };
    }

    async makeRequest(options) {
        try {
            const response = await fetch(this.client.endpoint, {
                method: 'POST',
                headers: this.client.headers,
                body: JSON.stringify({
                    model: options.model,
                    messages: [
                        {
                            role: 'system',
                            content: CONFIG.AI.SYSTEM_PROMPT
                        },
                        {
                            role: 'user',
                            content: options.message
                        }
                    ],
                    temperature: options.temperature,
                    max_tokens: options.maxTokens,
                    top_p: 0.9
                })
            });

            if (!response.ok) {
                throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();

            return {
                content: result.choices[0].message.content,
                usage: {
                    promptTokens: result.usage?.prompt_tokens || 0,
                    completionTokens: result.usage?.completion_tokens || 0,
                    totalTokens: result.usage?.total_tokens || 0
                }
            };
        } catch (error) {
            this.handleError(error);
        }
    }
}

export default OpenRouterService;
