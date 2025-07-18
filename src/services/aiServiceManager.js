/**
 * Professional AI Service Manager - Optimized for production
 * Manages multiple AI providers with priority-based selection from priority.json
 * Implements lazy initialization and service caching for improved performance
 */

import { logger } from '../utils/logger.js';
import { ServiceError } from '../utils/helpers.js';
import { getPriorityOrder, getPrioritySettings } from './priorityService.js';
import { CONFIG } from '../config/config.js';
import GroqService from './groqService.js';
import GeminiService from './geminiService.js';
import GitHubOpenAIService from './githubOpenAIService.js';
import OpenRouterService from './openRouterService.js';

class AIServiceManager {
  constructor() {
    this.services = new Map();
    this.serviceClasses = {
      groq: GroqService,
      github: GitHubOpenAIService,
      openrouter: OpenRouterService,
      gemini: GeminiService
    };

    // Cache for available services (refreshed every 30 seconds)
    this.availableServicesCache = null;
    this.availableServicesCacheTime = 0;
    this.CACHE_TTL = 30000; // 30 seconds
    
    // Only initialize services that have API keys
    this.lazyInitializeServices();
  }

  lazyInitializeServices() {
    // Don't initialize all services at startup - just register them
    // They will be initialized on first use
    const isProd = process.env.NODE_ENV === 'production';
    
    if (!isProd) {
      logger.info(`Service manager initialized with lazy loading for ${Object.keys(this.serviceClasses).length} providers`);
    }
  }
  
  async getService(serviceId) {
    // Check if service is already initialized
    if (this.services.has(serviceId)) {
      return this.services.get(serviceId);
    }
    
    // Initialize service on first use
    try {
      const ServiceClass = this.serviceClasses[serviceId];
      if (!ServiceClass) {
        throw new Error(`Service ${serviceId} not found`);
      }
      
      const service = new ServiceClass();
      this.services.set(serviceId, service);
      
      // Only log in non-production
      if (process.env.NODE_ENV !== 'production') {
        logger.info(`Service initialized on first use: ${serviceId}`);
      }
      
      return service;
      } catch (error) {
      logger.error(`Failed to initialize service: ${serviceId}`, { error: error.message });
      throw error;
    }
  }

  getAvailableServices() {
    const now = Date.now();
    
    // Return cached result if valid
    if (this.availableServicesCache && (now - this.availableServicesCacheTime < this.CACHE_TTL)) {
      return this.availableServicesCache;
    }
    
    // Get services in priority order from priority.json
    const priorityOrder = getPriorityOrder();

    const availableServices = priorityOrder
      .map(serviceId => {
        try {
          const ServiceClass = this.serviceClasses[serviceId];
          if (!ServiceClass) return null;
          
          // Create temporary instance to check API key without full initialization
          const tempService = new ServiceClass();

        const config = CONFIG.PROVIDERS[serviceId.toUpperCase()];
        if (!config) return null;

        return {
          id: serviceId,
          name: config.name,
          description: config.description,
            hasApiKey: tempService.hasApiKey(),
          priority: priorityOrder.indexOf(serviceId) + 1
        };
        } catch (error) {
          logger.warn(`Error checking service ${serviceId}`, { error: error.message });
          return null;
        }
      })
      .filter(service => service !== null && service.hasApiKey === true);
      
    // Update cache
    this.availableServicesCache = availableServices;
    this.availableServicesCacheTime = now;
    
    return availableServices;
  }

  async generateResponse(message, options = {}) {
    const availableServices = this.getAvailableServices();

    if (availableServices.length === 0) {
      throw new ServiceError('No AI services are available. Please check your API key configuration.');
    }

    const settings = getPrioritySettings();
    
    // Only log in non-production
    if (process.env.NODE_ENV !== 'production') {
    logger.info(`Starting AI request with ${availableServices.length} available services`, {
      noTimeoutRestrictions: settings.noTimeoutRestrictions,
      noTokenLimits: settings.noTokenLimits,
      allowCompleteResponse: settings.allowCompleteResponse
    });
    }

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
      attempts++;

      try {
        // Get or initialize the service
        const service = await this.getService(serviceInfo.id);
        
        // Only log in non-production
        if (process.env.NODE_ENV !== 'production') {
        logger.info(`Attempting request with ${serviceInfo.name} (attempt ${attempts})`);
        }

        const startTime = Date.now();
        const result = await service.generateResponse(message, requestOptions);
        const duration = Date.now() - startTime;

        // Only log in non-production
        if (process.env.NODE_ENV !== 'production') {
        logger.info(`Request successful with ${serviceInfo.name}`, {
          provider: serviceInfo.name,
          duration: `${duration}ms`,
          attempts,
          tokenCount: result.metadata?.usage?.totalTokens || 'unlimited'
        });
        }

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
        logger.error(`Request failed with ${serviceInfo.name}`, {
          provider: serviceInfo.name,
          error: error.message,
          attempt: attempts
        });

        // Don't retry on authentication errors
        if (error.status === 401) {
          break;
        }

        // For 503 errors, continue to next service but log the issue
        if (error.status === 503) {
          logger.warn(`${serviceInfo.name} temporarily unavailable (503), trying next service...`);
          continue;
        }
      }
    }

    // All services failed
    logger.error(`All AI services failed after ${attempts} attempts`, {
      lastError: lastError?.message
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
      null,
      500
    );
  }

  async testService(serviceId) {
    try {
      const service = await this.getService(serviceId);

    if (!service.isAvailable()) {
      throw new ServiceError(`Service ${serviceId} is not available`);
    }

    const testMessage = "Hello, this is a test message. Please respond with a brief greeting.";
      const startTime = Date.now();
      const result = await service.generateResponse(testMessage, { maxTokens: 50 });
      const duration = Date.now() - startTime;

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
    const availableServices = this.getAvailableServices();

    for (const service of availableServices) {
      const result = await this.testService(service.id);
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
      totalServices: Object.keys(this.serviceClasses).length,
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
