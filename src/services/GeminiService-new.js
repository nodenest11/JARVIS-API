/**
 * Google Gemini Service Implementation
 */

import OpenAI from 'openai';
import { BaseAIService } from './BaseAIService.js';
import { CONFIG } from '../config/config.js';

class GeminiService extends BaseAIService {
    constructor() {
        super(CONFIG.PROVIDERS.GEMINI);
    }

    async createClient() {
        // Gemini uses OpenAI-compatible endpoint
        this.client = new OpenAI({
            apiKey: this.apiKey,
            baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
            maxRetries: 0
        });
    }

    async makeRequest(options) {
        try {
            const response = await this.client.chat.completions.create({
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
                model: options.model,
                temperature: options.temperature,
                max_tokens: options.maxTokens
            });

            return {
                content: response.choices[0].message.content,
                usage: {
                    promptTokens: response.usage?.prompt_tokens || 0,
                    completionTokens: response.usage?.completion_tokens || 0,
                    totalTokens: response.usage?.total_tokens || 0
                }
            };
        } catch (error) {
            this.handleError(error);
        }
    }
}

export default GeminiService;
