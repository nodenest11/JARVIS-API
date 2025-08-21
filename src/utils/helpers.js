/**
 * Optimized utility functions for production performance
 */

/**
 * Create standardized API response object
 */
export function createResponse(success, data = null, error = null) {
  return {
    success,
    timestamp: new Date().toISOString(),
    ...(data !== null && { data }),
    ...(error !== null && { error })
  };
}

/**
 * Custom service error with status code
 */
export class ServiceError extends Error {
  constructor(message, serviceId = null, status = 500) {
    super(message);
    this.name = 'ServiceError';
    this.serviceId = serviceId;
    this.status = status;
  }
}

/**
 * Validate API key format
 */
export function validateApiKey(key, prefix) {
  if (!key || typeof key !== 'string') return false;
  return key.startsWith(prefix);
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff(fn, maxRetries = 2, initialDelay = 1000) {
  let retries = 0;
  let lastError = null;

  while (retries <= maxRetries) {
    try {
      const startTime = Date.now();
      const result = await fn();
      const duration = Date.now() - startTime;
      
      // Add duration to result
      return { ...result, duration };
    } catch (error) {
      lastError = error;
      
      // Don't retry on authentication errors or rate limits
      if (error.status === 401 || error.status === 429) {
        throw error;
      }

      if (retries >= maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff and jitter
      const delay = initialDelay * Math.pow(2, retries) * (0.9 + Math.random() * 0.2);
      await new Promise(resolve => setTimeout(resolve, delay));
      retries++;
    }
  }

  throw lastError;
}

/**
 * Sanitize user input to prevent injection attacks
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  // Remove potentially dangerous content
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, 'removed:')
    .replace(/on\w+=/gi, 'removed=')
    .trim();
}

/**
 * Truncate text to specified length
 */
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Generate a unique request ID
 */
export function generateRequestId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

/**
 * Check if a value is a valid JSON string
 */
export function isValidJson(str) {
  if (typeof str !== 'string') return false;
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}
