/**
 * GitHub OpenAI Service Implementation
 */

import ModelClient, { isUnexpected } from '@azure-rest/ai-inference';
import { AzureKeyCredential } from '@azure/core-auth';
import { BaseAIService } from './BaseAIService.js';
import { CONFIG } from '../config/config.js';

class GitHubOpenAIService extends BaseAIService {
  constructor() {
    super(CONFIG.PROVIDERS.GITHUB);
  }

  async createClient() {
    // Use the correct GitHub Models endpoint
    const endpoint = 'https://models.github.ai/inference';
    
    this.client = ModelClient(
      endpoint,
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
          max_tokens: options.maxTokens
        }
      });

      // Use isUnexpected to check for errors
      if (isUnexpected(response)) {
        throw response.body.error;
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
