/**
 * Professional AI Service Manager
 * Manages multiple AI providers with priority-based selection from priority.json
 * No token limits or timeout restrictions - allows complete responses
 */

import { logger } from '../utils/logger.js';
import { ServiceError, measureTime } from '../utils/helpers.js';
import { getPriorityOrder, getPrioritySettings } from './priorityService.js';
import { CONFIG } from '../config/config.js';
import GroqService from './groqService.js';
import GeminiService from './geminiService.js';
import GitHubOpenAIService from './githubOpenAIService.js';
import OpenRouterService from './openRouterService.js';

class AIServiceManager {
  constructor() {
    this.services = new Map();
    this.initializeServices();
  }

  initializeServices() {
    // Initialize available services
    const serviceClasses = {
      groq: GroqService,
      github: GitHubOpenAIService,
      openrouter: OpenRouterService,
      gemini: GeminiService
    };

    // Create all services
    Object.entries(serviceClasses).forEach(([id, ServiceClass]) => {
      try {
        this.services.set(id, new ServiceClass());
        logger.info(`Service initialized: ${id}`);
      } catch (error) {
        logger.error(`Failed to initialize service: ${id}`, { error: error.message });
      }
    });

    logger.info(`Service manager initialized with ${this.services.size} providers`);
  }

  getAvailableServices() {
    // Get services in priority order from priority.json
    const priorityOrder = getPriorityOrder();

    return priorityOrder
      .map(serviceId => {
        const service = this.services.get(serviceId);
        if (!service) return null;

        const config = CONFIG.PROVIDERS[serviceId.toUpperCase()];
        if (!config) return null;

        return {
          id: serviceId,
          name: config.name,
          description: config.description,
          hasApiKey: service.hasApiKey(),
          priority: priorityOrder.indexOf(serviceId) + 1
        };
      })
      .filter(service => service !== null && service.hasApiKey === true);
  }

  async generateResponse(message, options = {}) {
    const availableServices = this.getAvailableServices();

    if (availableServices.length === 0) {
      throw new ServiceError('No AI services are available. Please check your API key configuration.');
    }

    const settings = getPrioritySettings();
    logger.info(`Starting AI request with ${availableServices.length} available services`, {
      noTimeoutRestrictions: settings.noTimeoutRestrictions,
      noTokenLimits: settings.noTokenLimits,
      allowCompleteResponse: settings.allowCompleteResponse
    });

    // Remove all restrictions for complete responses
    const requestOptions = {
      ...options,
      // Remove token limits to allow complete responses
      maxTokens: settings.noTokenLimits ? null : options.maxTokens,
      // Remove timeout restrictions
      timeout: settings.noTimeoutRestrictions ? null : options.timeout
    };

    let lastError = null;
    let attempts = 0;

    // Try each service in priority order
    for (const serviceInfo of availableServices) {
      const service = this.services.get(serviceInfo.id);
      attempts++;

      try {
        logger.info(`Attempting request with ${serviceInfo.name} (attempt ${attempts})`);

        const { result, duration } = await measureTime(() =>
          service.generateResponse(message, requestOptions)
        );

        logger.info(`Request successful with ${serviceInfo.name}`, {
          provider: serviceInfo.name,
          duration: `${duration}ms`,
          attempts,
          tokenCount: result.metadata?.usage?.totalTokens || 'unlimited'
        });

        return {
          ...result,
          fallbackUsed: attempts > 1,
          totalAttempts: attempts,
          availableServices: availableServices.length,
          settings: {
            noTimeoutRestrictions: settings.noTimeoutRestrictions,
            noTokenLimits: settings.noTokenLimits,
            allowCompleteResponse: settings.allowCompleteResponse
          }
        };

      } catch (error) {
        lastError = error;
        
        // Enhanced error logging with detailed information
        logger.error(`❌ Request failed with ${serviceInfo.name} - Detailed Error Information`, {
          provider: serviceInfo.name,
          error: error.message,
          attempt: attempts,
          status: error.status,
          stack: error.stack,
          name: error.name,
          cause: error.cause,
          timestamp: new Date().toISOString(),
          messageLength: message.length,
          requestOptions: JSON.stringify(requestOptions, null, 2)
        });

        // Log the full error object for debugging
        console.error(`🔍 Full error object for ${serviceInfo.name}:`, {
          ...error,
          stack: error.stack,
          provider: serviceInfo.name,
          attempt: attempts
        });

        // Don't retry on authentication errors
        if (error.status === 401) {
          logger.error(`❌ Authentication error with ${serviceInfo.name}, stopping retry attempts`);
          break;
        }

        // For 503 errors, continue to next service but log the issue
        if (error.status === 503) {
          logger.warn(`⚠️ ${serviceInfo.name} temporarily unavailable (503), trying next service...`);
          continue;
        }

        // For other errors, log and continue
        logger.warn(`⚠️ ${serviceInfo.name} failed with status ${error.status || 'unknown'}, trying next service...`);
      }
    }

    // All services failed - provide comprehensive error information
    logger.error(`❌ All AI services failed after ${attempts} attempts - Comprehensive Error Report`, {
      totalAttempts: attempts,
      availableServices: availableServices.length,
      lastError: lastError?.message,
      lastErrorStatus: lastError?.status,
      lastErrorStack: lastError?.stack,
      lastErrorName: lastError?.name,
      servicesTried: availableServices.map(s => s.name),
      timestamp: new Date().toISOString(),
      messageLength: message.length,
      requestOptions: JSON.stringify(requestOptions, null, 2)
    });

    // Log the complete error context
    console.error('🔍 Complete failure context:', {
      attempts,
      lastError: lastError ? {
        message: lastError.message,
        status: lastError.status,
        stack: lastError.stack,
        name: lastError.name,
        cause: lastError.cause
      } : null,
      availableServices: availableServices.map(s => ({
        id: s.id,
        name: s.name,
        hasApiKey: s.hasApiKey
      })),
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });

    // Better error message for 503 errors
    if (lastError?.status === 503) {
      throw new ServiceError(
        `AI services are temporarily unavailable. Please try again in a few moments.`,
        null,
        503
      );
    }

    throw new ServiceError(
      `All AI services failed. Last error: ${lastError?.message || 'Unknown error'}`,
      lastError,
      lastError?.status || 500
    );
  }

  async testService(serviceId) {
    const service = this.services.get(serviceId);
    if (!service) {
      throw new ServiceError(`Service ${serviceId} not found`);
    }

    if (!service.isAvailable()) {
      throw new ServiceError(`Service ${serviceId} is not available`);
    }

    const testMessage = "Hello, this is a test message. Please respond with a brief greeting.";

    try {
      const { result, duration } = await measureTime(() =>
        service.generateResponse(testMessage, { maxTokens: 50 })
      );

      logger.info(`Test successful for ${serviceId}`, { duration: `${duration}ms` });

      return {
        success: true,
        service: serviceId,
        provider: result.provider,
        model: result.model,
        response: result.response.substring(0, 100),
        responseTime: duration
      };

    } catch (error) {
      logger.error(`Test failed for ${serviceId}`, { error: error.message });

      return {
        success: false,
        service: serviceId,
        error: error.message
      };
    }
  }

  async testAllServices() {
    const results = [];

    for (const [serviceId] of this.services) {
      const result = await this.testService(serviceId);
      results.push(result);
    }

    const successfulServices = results.filter(r => r.success).length;

    logger.info(`Service test completed: ${successfulServices}/${results.length} services working`);

    return {
      totalServices: results.length,
      availableServices: successfulServices,
      results
    };
  }

  getServiceStatus() {
    const availableServices = this.getAvailableServices();

    return {
      totalServices: this.services.size,
      availableServices: availableServices.length,
      services: availableServices,
      currentPriority: availableServices[0]?.name || 'None available'
    };
  }

  getServiceDetails() {
    const services = this.getAvailableServices();
    return services.map(service => ({
      id: service.id,
      name: service.name,
      description: service.description,
      priority: service.priority,
      isEnabled: service.hasApiKey,
      settings: getPrioritySettings()
    }));
  }
}

export default AIServiceManager;
