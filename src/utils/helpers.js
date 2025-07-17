/**
 * Utility functions for validation, error handling, and common operations
 */

export class ValidationError extends Error {
    constructor(message, field = null) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
    }
}

export class ServiceError extends Error {
    constructor(message, provider = null, status = 500) {
        super(message);
        this.name = 'ServiceError';
        this.provider = provider;
        this.status = status;
    }
}

/**
 * Validates chat request parameters
 */
export function validateChatRequest(message, temperature, maxTokens) {
    const errors = [];

    // Validate message - only required field
    if (!message || typeof message !== 'string') {
        errors.push('Message is required and must be a string');
    } else if (message.trim().length === 0) {
        errors.push('Message cannot be empty');
    } else if (message.length > 50000) { // Increased limit for complete responses
        errors.push('Message is too long (max 50000 characters)');
    }

    if (errors.length > 0) {
        throw new ValidationError(errors.join(', '));
    }

    // Return only the message - everything else is handled automatically
    return {
        message: message.trim()
    };
}

/**
 * Validates API key format for a specific provider
 */
export function validateApiKey(apiKey, expectedPrefix) {
    if (!apiKey) return false;
    if (apiKey.length < 10) return false;
    if (expectedPrefix && !apiKey.startsWith(expectedPrefix)) return false;
    return true;
}

/**
 * Sanitizes error messages for client response
 */
export function sanitizeError(error, isDevelopment = false) {
    if (isDevelopment) {
        return {
            message: error.message,
            stack: error.stack,
            name: error.name
        };
    }

    // Production error messages
    if (error.message.includes('API key') || error.message.includes('auth')) {
        return { message: 'Authentication error. Please check your API configuration.' };
    }

    if (error.message.includes('rate limit') || error.message.includes('429')) {
        return { message: 'Rate limit exceeded. Please try again later.' };
    }

    if (error.message.includes('timeout')) {
        return { message: 'Request timeout. Please try again.' };
    }

    return { message: 'An unexpected error occurred. Please try again.' };
}

/**
 * Creates a standardized response object
 */
export function createResponse(success, data = null, error = null, metadata = {}) {
    const response = {
        success,
        timestamp: new Date().toISOString(),
        ...metadata
    };

    if (success) {
        response.data = data;
    } else {
        response.error = error;
    }

    return response;
}

/**
 * Measures execution time of an async function
 */
export async function measureTime(fn) {
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;

    return {
        result,
        duration
    };
}

/**
 * Retry mechanism with exponential backoff
 */
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Don't retry on authentication errors
            if (error.message.includes('401') || error.message.includes('auth')) {
                throw error;
            }

            // Don't retry on last attempt
            if (i === maxRetries - 1) {
                throw error;
            }

            // Wait with exponential backoff, longer for 503 errors
            let delay = baseDelay * Math.pow(2, i);
            if (error.message.includes('503') || error.message.includes('service unavailable')) {
                delay = delay * 2; // Double the delay for service unavailable errors
            }

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}

/**
 * Deep merge objects
 */
export function deepMerge(target, source) {
    const result = { ...target };

    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge(result[key] || {}, source[key]);
        } else {
            result[key] = source[key];
        }
    }

    return result;
}

/**
 * Truncates text to specified length
 */
export function truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Formats duration in milliseconds to human readable format
 */
export function formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
}
