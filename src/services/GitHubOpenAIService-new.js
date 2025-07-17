/**
 * GitHub OpenAI Service Implementation
 */

import { AzureKeyCredential } from '@azure/core-auth';
import { ModelClient } from '@azure-rest/ai-inference';
import { BaseAIService } from './BaseAIService.js';
import { CONFIG } from '../config/config.js';

class GitHubOpenAIService extends BaseAIService {
    constructor() {
        super(CONFIG.PROVIDERS.GITHUB);
    }

    async createClient() {
        this.client = new ModelClient(
            this.config.baseURL,
            new AzureKeyCredential(this.apiKey)
        );
    }

    async makeRequest(options) {
        try {
            const response = await this.client.path('/chat/completions').post({
                body: {
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
                    max_tokens: options.maxTokens,
                    top_p: 0.9
                }
            });

            if (response.status !== '200') {
                throw new Error(`GitHub API error: ${response.status}`);
            }

            const result = response.body;

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

export default GitHubOpenAIService;
