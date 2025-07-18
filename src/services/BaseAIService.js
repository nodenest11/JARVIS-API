/**
 * Base class for all AI service providers
 * Provides common functionality and enforces consistent interface
 */

import { CONFIG } from '../config/config.js';
import { ServiceError, validateApiKey, measureTime, retryWithBackoff } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';
import { getProviderModel, reloadPriorityConfig } from './priorityService.js';

export class BaseAIService {
    constructor(providerConfig) {
        this.config = providerConfig;
        this.apiKey = process.env[providerConfig.envKey];
        this.isInitialized = false;
        this.client = null;

        this.validateConfiguration();
    }

    validateConfiguration() {
        if (!this.apiKey) {
            logger.warn(`API key not found for ${this.config.name}`, { envKey: this.config.envKey });
            return;
        }

        if (!validateApiKey(this.apiKey, this.config.keyPrefix)) {
            logger.warn(`Invalid API key format for ${this.config.name}`, {
                expected: this.config.keyPrefix,
                envKey: this.config.envKey
            });
            return;
        }

        logger.info(`API key validated for ${this.config.name}`);
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
            // Always reload to get latest model from priority.json
            reloadPriorityConfig();
            return getProviderModel(this.config.id);
        } catch (error) {
            logger.warn(`Failed to get model from priority.json for ${this.config.id}:`, error.message);
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
        logger.info(`${this.config.name} service initialized successfully`);
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

        logger.info(`Generating response with ${this.config.name}`, {
            model: requestOptions.model,
            temperature,
            maxTokens,
            messageLength: message.length
        });

        const { result, duration } = await measureTime(() =>
            retryWithBackoff(() => this.makeRequest(requestOptions), 3, 1000)
        );

        logger.logAIRequest(this.config.name, requestOptions.model, true, duration);

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
    }

    async makeRequest(options) {
        throw new Error('makeRequest method must be implemented by subclass');
    }

    handleError(error) {
        // Enhanced error logging with comprehensive details
        logger.error(`❌ ${this.config.name} request failed - Comprehensive Error Details`, {
            error: error.message,
            provider: this.config.name,
            providerId: this.config.id,
            status: error.status || error.code,
            stack: error.stack,
            name: error.name,
            cause: error.cause,
            response: error.response ? {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            } : null,
            timestamp: new Date().toISOString(),
            apiKeyStatus: this.hasApiKey() ? 'present' : 'missing',
            initialized: this.isInitialized
        });

        // Log the full error object for debugging
        console.error(`🔍 Full error object for ${this.config.name}:`, {
            ...error,
            stack: error.stack,
            response: error.response,
            provider: this.config.name,
            timestamp: new Date().toISOString()
        });

        // Extract status code from various error formats
        const statusCode = error.status || error.code || 
                          (error.response && error.response.status) || 
                          (error.message.includes('401') ? 401 : 
                           error.message.includes('429') ? 429 : 
                           error.message.includes('503') ? 503 : 500);

        // Standardize error messages based on status codes and content
        if (statusCode === 401 || error.message.includes('401') || error.message.includes('auth')) {
            throw new ServiceError(
                `Authentication failed for ${this.config.name}. Please check your API key.`,
                this.config.id,
                401
            );
        }

        if (statusCode === 429 || error.message.includes('429') || error.message.includes('rate limit')) {
            throw new ServiceError(
                `Rate limit exceeded for ${this.config.name}. Please try again later.`,
                this.config.id,
                429
            );
        }

        if (statusCode === 503 || error.message.includes('503') || error.message.includes('service unavailable')) {
            throw new ServiceError(
                `${this.config.name} service is temporarily unavailable. Please try again in a few moments.`,
                this.config.id,
                503
            );
        }

        if (statusCode === 408 || error.message.includes('timeout')) {
            throw new ServiceError(
                `Request timeout for ${this.config.name}. Please try again.`,
                this.config.id,
                408
            );
        }

        // Generic error with enhanced details
        throw new ServiceError(
            `${this.config.name} request failed: ${error.message}`,
            this.config.id,
            statusCode
        );
    }
}
