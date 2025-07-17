/**
 * Groq AI Service Implementation
 */

import OpenAI from 'openai';
import { BaseAIService } from './BaseAIService.js';
import { CONFIG } from '../config/config.js';

class GroqService extends BaseAIService {
  constructor() {
    super(CONFIG.PROVIDERS.GROQ);
  }

  async createClient() {
    this.client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: this.config.baseURL,
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
        max_tokens: options.maxTokens,
        top_p: 0.9
      });

      return {
        content: response.choices[0].message.content,
        usage: {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens
        }
      };
    } catch (error) {
      this.handleError(error);
    }
  }
}

export default GroqService;
