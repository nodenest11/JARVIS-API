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
 * Request logging middleware for debugging and monitoring
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log incoming request details
  logger.info(`📥 ${req.method} ${req.path} - Request received`, {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    bodySize: req.body ? JSON.stringify(req.body).length : 0,
    hasBody: !!req.body,
    timestamp: new Date().toISOString()
  });

  // Log request body for debugging (truncate if too long)
  if (req.body && Object.keys(req.body).length > 0) {
    const bodyStr = JSON.stringify(req.body);
    logger.info(`📝 Request body preview`, {
      bodyPreview: bodyStr.length > 200 ? bodyStr.substring(0, 200) + '...' : bodyStr,
      fullBodyLength: bodyStr.length
    });
  }

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    
    logger.info(`📤 ${req.method} ${req.path} → ${statusCode} (${duration}ms)`, {
      method: req.method,
      path: req.path,
      statusCode,
      duration: `${duration}ms`,
      responseSize: JSON.stringify(data).length,
      success: statusCode < 400,
      timestamp: new Date().toISOString()
    });

    // Log response details for errors
    if (statusCode >= 400) {
      logger.error(`❌ Error response details`, {
        statusCode,
        method: req.method,
        path: req.path,
        duration: `${duration}ms`,
        responseData: data,
        timestamp: new Date().toISOString()
      });
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * CORS middleware for handling cross-origin requests
 */
export const corsMiddleware = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
};

/**
 * Global error handler middleware
 */
export const errorHandler = (error, req, res, next) => {
  logger.error(`❌ Unhandled error in ${req.method} ${req.path}`, {
    error: error.message,
    stack: error.stack,
    method: req.method,
    path: req.path,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  console.error('🔍 Full unhandled error details:', {
    ...error,
    stack: error.stack,
    method: req.method,
    path: req.path,
    timestamp: new Date().toISOString()
  });

  const response = createResponse(false, null, {
    message: 'Internal server error occurred',
    details: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later',
    debugInfo: process.env.NODE_ENV === 'development' ? {
      stack: error.stack,
      timestamp: new Date().toISOString()
    } : undefined
  });

  res.status(500).json(response);
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
