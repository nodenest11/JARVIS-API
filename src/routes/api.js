/**
 * API Routes - Optimized for production performance
 */

import express from 'express';
import AIServiceManager from '../services/aiServiceManager.js';
import { chatRequestValidator } from '../middleware/index.js';
import { createResponse } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const aiManager = new AIServiceManager();

// Cache for status responses (5 seconds)
let statusCache = null;
let statusCacheTime = 0;
const STATUS_CACHE_TTL = 5000; // 5 seconds

/**
 * POST /api/chat - Main chat endpoint with intelligent fallback
 * Optimized for production performance
 */
router.post('/chat', chatRequestValidator, async (req, res) => {
  const { message } = req.body;
  const startTime = Date.now();

  // Only log minimal info in production
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
  logger.info('Chat request received', {
    messageLength: message.length,
    autoMode: true
  });
  }

  try {
    // Everything handled automatically - no manual configuration needed
    const result = await aiManager.generateResponse(message);
    const duration = Date.now() - startTime;

    if (!isProd) {
    logger.info('Chat request completed successfully', {
      provider: result.provider,
      model: result.model,
      duration: `${duration}ms`,
        fallbackUsed: result.fallbackUsed
    });
    }

    const response = createResponse(true, {
      response: result.response,
      provider: result.provider,
      model: result.model,
      fallbackUsed: result.fallbackUsed,
      totalAttempts: result.totalAttempts,
      responseTime: duration,
      settings: result.settings
    });

    res.json(response);

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Chat request failed', { 
      error: error.message,
      duration: `${duration}ms`
    });

    let errorMessage = 'AI service temporarily unavailable. Please try again.';
    let statusCode = error.status || 500;

    // Map common error codes to friendly messages
    switch (statusCode) {
      case 503:
      errorMessage = 'AI services are temporarily unavailable due to high demand. Please try again in a few moments.';
        break;
      case 401:
      errorMessage = 'Authentication error. Please check API configuration.';
        break;
      case 429:
      errorMessage = 'Rate limit exceeded. Please wait a moment before trying again.';
        break;
    }

    const response = createResponse(false, null, {
      message: errorMessage,
      details: isProd ? undefined : error.message,
      status: statusCode
    });

    res.status(statusCode).json(response);
  }
});

/**
 * GET /api/status - Service status and health information
 * Cached for 5 seconds to improve performance
 */
router.get('/status', (req, res) => {
  try {
    const now = Date.now();
    
    // Return cached response if valid
    if (statusCache && (now - statusCacheTime < STATUS_CACHE_TTL)) {
      return res.json(statusCache);
    }
    
    const status = aiManager.getServiceStatus();

    const response = createResponse(true, {
      status: 'operational',
      ...status,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });

    // Update cache
    statusCache = response;
    statusCacheTime = now;
    
    // Set cache headers
    res.set('Cache-Control', 'public, max-age=5');
    res.json(response);

  } catch (error) {
    logger.error('Status check failed', { error: error.message });

    const response = createResponse(false, null, {
      message: 'Unable to retrieve service status',
      details: process.env.NODE_ENV === 'production' ? undefined : error.message
    });

    res.status(500).json(response);
  }
});

/**
 * POST /api/test - Test all available AI services
 */
router.post('/test', async (req, res) => {
  const startTime = Date.now();
  logger.info('Testing all AI services');

  try {
    const result = await aiManager.testAllServices();
    const duration = Date.now() - startTime;

    logger.info('Service testing completed', {
      totalServices: result.totalServices,
      availableServices: result.availableServices,
      duration: `${duration}ms`
    });

    const response = createResponse(true, {
      ...result,
      testDuration: duration
    });

    res.json(response);

  } catch (error) {
    logger.error('Service testing failed', { error: error.message });

    const response = createResponse(false, null, {
      message: 'Service testing failed',
      details: process.env.NODE_ENV === 'production' ? undefined : error.message
    });

    res.status(500).json(response);
  }
});

/**
 * POST /api/test/:serviceId - Test specific AI service
 */
router.post('/test/:serviceId', async (req, res) => {
  const { serviceId } = req.params;
  const startTime = Date.now();

  logger.info(`Testing service: ${serviceId}`);

  try {
    const result = await aiManager.testService(serviceId);
    const duration = Date.now() - startTime;

    logger.info(`Service test completed for ${serviceId}`, {
      success: result.success,
      duration: `${duration}ms`
    });

    const response = createResponse(true, {
      ...result,
      testDuration: duration
    });

    res.json(response);

  } catch (error) {
    logger.error(`Service test failed for ${serviceId}`, { error: error.message });

    const response = createResponse(false, null, {
      message: `Service test failed for ${serviceId}`,
      details: process.env.NODE_ENV === 'production' ? undefined : error.message
    });

    res.status(500).json(response);
  }
});

export default router;
