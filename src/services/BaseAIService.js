/**
 * Base class for all AI service providers
 * Optimized for production performance
 */

import { CONFIG } from '../config/config.js';
import { ServiceError, validateApiKey, retryWithBackoff } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';
import { getProviderModel, reloadPriorityConfig } from './priorityService.js';

export class BaseAIService {
    constructor(providerConfig) {
        this.config = providerConfig;
        this.apiKey = process.env[providerConfig.envKey];
        this.isInitialized = false;
        this.client = null;
        this.currentModel = null;
        
        // Only validate in constructor, don't initialize client yet
        this.validateApiKey();
    }

    validateApiKey() {
        if (!this.apiKey) {
            if (process.env.NODE_ENV !== 'production') {
                logger.warn(`API key not found for ${this.config.name}`, { envKey: this.config.envKey });
            }
            return false;
        }

        if (!validateApiKey(this.apiKey, this.config.keyPrefix)) {
            if (process.env.NODE_ENV !== 'production') {
                logger.warn(`Invalid API key format for ${this.config.name}`, {
                    expected: this.config.keyPrefix,
                    envKey: this.config.envKey
                });
            }
            return false;
        }

        if (process.env.NODE_ENV !== 'production') {
            logger.info(`API key validated for ${this.config.name}`);
        }
        return true;
    }

    isAvailable() {
        return !!this.apiKey && validateApiKey(this.apiKey, this.config.keyPrefix);
    }

    hasApiKey() {
        return !!this.apiKey && validateApiKey(this.apiKey, this.config.keyPrefix);
    }

    getProviderInfo() {
        return {
            id: this.config.id,
            name: this.config.name,
            model: this.getCurrentModel(),
            available: this.isAvailable(),
            timeout: this.config.timeout
        };
    }

    getCurrentModel() {
        try {
            // Use cached model if available
            if (this.currentModel) {
                return this.currentModel;
            }
            
            // Only reload in development or when forced
            if (process.env.NODE_ENV !== 'production') {
                reloadPriorityConfig();
            }
            
            this.currentModel = getProviderModel(this.config.id);
            return this.currentModel;
        } catch (error) {
            logger.warn(`Failed to get model for ${this.config.id}:`, error.message);
            throw error;
        }
    }

    async initialize() {
        if (this.isInitialized) return;

        if (!this.isAvailable()) {
            throw new ServiceError(
                `${this.config.name} is not available. Please check your API key configuration.`,
                this.config.id
            );
        }

        await this.createClient();
        this.isInitialized = true;
        
        if (process.env.NODE_ENV !== 'production') {
            logger.info(`${this.config.name} service initialized successfully`);
        }
    }

    async createClient() {
        throw new Error('createClient method must be implemented by subclass');
    }

    async generateResponse(message, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const {
            temperature = CONFIG.AI.DEFAULT_TEMPERATURE,
            maxTokens = CONFIG.AI.DEFAULT_MAX_TOKENS
        } = options;

        const requestOptions = {
            message: message.trim(),
            temperature,
            maxTokens,
            model: this.getCurrentModel()
        };

        if (process.env.NODE_ENV !== 'production') {
            logger.info(`Generating response with ${this.config.name}`, {
                model: requestOptions.model,
                temperature,
                maxTokens,
                messageLength: message.length
            });
        }

        try {
            // Use fewer retries in production for faster response
            const maxRetries = process.env.NODE_ENV === 'production' ? 1 : 2;
            const result = await retryWithBackoff(() => this.makeRequest(requestOptions), maxRetries, 1000);
            const duration = result.duration || 0;

            if (process.env.NODE_ENV !== 'production') {
                logger.info(`${this.config.name} request completed`, {
                    duration: `${duration}ms`,
                    model: requestOptions.model
                });
            }

            return {
                success: true,
                response: result.content,
                provider: this.config.name,
                model: requestOptions.model,
                metadata: {
                    responseTime: duration,
                    usage: result.usage || {},
                    temperature,
                    maxTokens
                }
            };
        } catch (error) {
            // Let error handler standardize the error
            this.handleError(error);
        }
    }

    async makeRequest(options) {
        throw new Error('makeRequest method must be implemented by subclass');
    }

    handleError(error) {
        // Only log detailed errors in development
        if (process.env.NODE_ENV !== 'production') {
            logger.error(`${this.config.name} request failed`, {
                error: error.message,
                provider: this.config.name
            });
        } else {
            // Minimal logging in production
            logger.error(`${this.config.name} error: ${error.status || 500}`);
        }

        // Standardize error messages
        if (error.message.includes('401') || error.message.includes('auth')) {
            throw new ServiceError(
                `Authentication failed for ${this.config.name}. Please check your API key.`,
                this.config.id,
                401
            );
        }

        if (error.message.includes('429') || error.message.includes('rate limit')) {
            throw new ServiceError(
                `Rate limit exceeded for ${this.config.name}. Please try again later.`,
                this.config.id,
                429
            );
        }

        if (error.message.includes('503') || error.message.includes('service unavailable')) {
            throw new ServiceError(
                `${this.config.name} service is temporarily unavailable. Please try again in a few moments.`,
                this.config.id,
                503
            );
        }

        if (error.message.includes('timeout')) {
            throw new ServiceError(
                `Request timeout for ${this.config.name}. Please try again.`,
                this.config.id,
                408
            );
        }

        throw new ServiceError(
            `${this.config.name} request failed: ${error.message}`,
            this.config.id,
            500
        );
    }
}
