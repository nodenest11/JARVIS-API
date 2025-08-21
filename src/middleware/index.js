/**
 * Optimized middleware for production performance
 */

import { logger } from '../utils/logger.js';
import { sanitizeInput } from '../utils/helpers.js';

// In-memory rate limiter store
const rateLimitStore = new Map();

/**
 * CORS middleware - optimized for production
 */
export const corsMiddleware = (req, res, next) => {
  // Allow requests from any origin in development
  // In production, be more restrictive if needed
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? (process.env.ALLOWED_ORIGINS || '*').split(',')
    : '*';
    
  const origin = req.headers.origin;
  
  if (allowedOrigins === '*') {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours cache for preflight

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
};

/**
 * Request logging middleware - optimized to only run in development
 */
export const requestLogger = (req, res, next) => {
  // Skip logging in production for better performance
  if (process.env.NODE_ENV === 'production') {
    return next();
  }
  
  const start = Date.now();
  const requestId = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
  
  // Add request ID for tracking
  req.requestId = requestId;
  
  // Log request
  logger.info(`${req.method} ${req.originalUrl}`, {
    requestId,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'error' : 'info';
    
    logger[level](`${res.statusCode} ${req.method} ${req.originalUrl}`, {
      requestId,
      duration: `${duration}ms`,
      status: res.statusCode
    });
  });
  
  next();
};

/**
 * Error handling middleware - optimized for production
 */
export const errorHandler = (err, req, res, next) => {
  // Log error with stack trace in development only
  if (process.env.NODE_ENV === 'production') {
    logger.error(`${err.name}: ${err.message}`, { 
      status: err.status || 500,
      path: req.path
    });
  } else {
    logger.error(`${err.name}: ${err.message}`, { 
      status: err.status || 500,
      stack: err.stack,
      path: req.path
    });
  }
  
  // Send appropriate error response
  const statusCode = err.status || 500;
  const errorMessage = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal server error'
    : err.message;
    
  res.status(statusCode).json({
    success: false,
    error: {
      message: errorMessage,
      status: statusCode
    }
  });
};

/**
 * Chat request validation middleware - optimized for performance
 */
export const chatRequestValidator = (req, res, next) => {
  try {
    const { message } = req.body;
    
    // Validate message
    if (!message) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Message is required',
          status: 400
        }
      });
    }
    
    if (typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Message must be a string',
          status: 400
        }
      });
    }
    
    // Sanitize input
    req.body.message = sanitizeInput(message.trim());
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Rate limiter middleware - optimized with in-memory store
 */
export const rateLimiter = (windowMs = 60000, maxRequests = 60) => {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Get or create rate limit entry
    if (!rateLimitStore.has(ip)) {
      rateLimitStore.set(ip, {
        count: 0,
        resetTime: now + windowMs
      });
    }
    
    const entry = rateLimitStore.get(ip);
    
    // Reset if window expired
    if (now > entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + windowMs;
    }
    
    // Increment count
    entry.count++;
    
    // Set headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count));
    res.setHeader('X-RateLimit-Reset', entry.resetTime);
    
    // Check if over limit
    if (entry.count > maxRequests) {
      return res.status(429).json({
        success: false,
        error: {
          message: 'Too many requests, please try again later',
          status: 429
        }
      });
    }
    
    // Clean up old entries every 5 minutes
    if (now % 300000 < 1000) {
      cleanupRateLimitStore(now);
    }
    
    next();
  };
};

/**
 * Clean up expired rate limit entries
 */
function cleanupRateLimitStore(now) {
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}
