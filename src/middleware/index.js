/**
 * Professional middleware for request handling, validation, and logging
 */

import { validateChatRequest, ValidationError, sanitizeError, createResponse } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';
import { CONFIG } from '../config/config.js';

/**
 * Request validation middleware for chat endpoints
 */
export const chatRequestValidator = (req, res, next) => {
  try {
    const { message } = req.body;
    const validated = validateChatRequest(message);

    // Replace request body with validated data
    req.body = validated;
    next();
  } catch (error) {
    if (error instanceof ValidationError) {
      const response = createResponse(false, null, {
        message: error.message,
        field: error.field
      });
      return res.status(400).json(response);
    }

    next(error);
  }
};

/**
 * Request logging middleware
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - startTime;
    logger.logRequest(req, res, duration);
    return originalSend.call(this, data);
  };

  next();
};

/**
 * CORS middleware
 */
export const corsMiddleware = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
};

/**
 * Global error handler
 */
export const errorHandler = (error, req, res, next) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method
  });

  const sanitizedError = sanitizeError(error, CONFIG.SERVER.NODE_ENV === 'development');
  const response = createResponse(false, null, sanitizedError);

  const statusCode = error.status || 500;
  res.status(statusCode).json(response);
};

/**
 * Rate limiting middleware (basic implementation)
 */
export const rateLimiter = (windowMs = 60000, maxRequests = 100) => {
  const requests = new Map();

  return (req, res, next) => {
    const clientId = req.ip;
    const now = Date.now();

    if (!requests.has(clientId)) {
      requests.set(clientId, []);
    }

    const clientRequests = requests.get(clientId);

    // Remove old requests
    const validRequests = clientRequests.filter(timestamp => now - timestamp < windowMs);

    if (validRequests.length >= maxRequests) {
      const response = createResponse(false, null, {
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: windowMs / 1000
      });
      return res.status(429).json(response);
    }

    validRequests.push(now);
    requests.set(clientId, validRequests);

    next();
  };
};
