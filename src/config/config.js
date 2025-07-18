/**
 * Optimized configuration management for JARVIS AI API
 * Uses caching and minimal environment variable lookups for better performance
 * Properly respects .env configuration for DigitalOcean deployment
 */

// Cache configuration to avoid repeated environment variable lookups
let configCache = null;

// Helper function to build base URL dynamically for DigitalOcean
const buildBaseUrl = () => {
    // Get port from environment with fallback to 3002 (user's preference)
    const port = parseInt(process.env.PORT) || 3002;
    const nodeEnv = process.env.NODE_ENV || 'development';

    // If BASE_URL is explicitly set, use it
    if (process.env.BASE_URL) {
        return process.env.BASE_URL;
    }

    // For production on DigitalOcean, use the droplet's IP or domain
    if (nodeEnv === 'production') {
        // For DigitalOcean, port 80/443 might be mapped to the application port
        if (process.env.DIGITAL_OCEAN_IP) {
            return `http://${process.env.DIGITAL_OCEAN_IP}:${port}`;
        }
        return `http://localhost:${port}`;
    }

    // For development, use localhost with the specified port
    return `http://localhost:${port}`;
};

// Dynamic configuration getter with caching
export const getConfig = () => {
    // Return cached config if available
    if (configCache) {
        return configCache;
    }

    // Get port from environment with fallback to 3002 (user's preference)
    const port = parseInt(process.env.PORT) || 3002;

    // Create new config
    configCache = {
    // Server Configuration
    SERVER: {
            PORT: port,
        NODE_ENV: process.env.NODE_ENV || 'development',
        BASE_URL: buildBaseUrl(),
            REQUEST_SIZE_LIMIT: '5mb', // Reduced for better performance
        CORS_ENABLED: true
    },

    // AI Service Configuration
    AI: {
        DEFAULT_TEMPERATURE: 0.7,
        DEFAULT_MAX_TOKENS: 1000,
        MIN_TEMPERATURE: 0.0,
        MAX_TEMPERATURE: 2.0,
        MIN_TOKENS: 1,
        MAX_TOKENS: 4000,
        REQUEST_TIMEOUT: 30000,
            MAX_RETRIES: process.env.NODE_ENV === 'production' ? 1 : 2, // Fewer retries in production
        SYSTEM_PROMPT: "You are JARVIS, a professional AI assistant. Provide direct, helpful, and accurate responses."
    },

    // Provider Configuration
    PROVIDERS: {
        GROQ: {
            id: 'groq',
            name: 'Groq',
            baseURL: 'https://api.groq.com/openai/v1',
            timeout: 25000,
            envKey: 'GROQ_API_KEY',
            keyPrefix: 'gsk_'
        },
        GITHUB: {
            id: 'github',
            name: 'GitHub OpenAI',
            baseURL: 'https://models.inference.ai.azure.com',
            timeout: 45000,
            envKey: 'GITHUB_TOKEN',
            keyPrefix: 'github_pat_'
        },
        OPENROUTER: {
            id: 'openrouter',
            name: 'OpenRouter',
            baseURL: 'https://openrouter.ai/api/v1',
            timeout: 30000,
            envKey: 'OPENROUTER_API_KEY',
            keyPrefix: 'sk-or-v1-'
        },
        GEMINI: {
            id: 'gemini',
            name: 'Google Gemini',
            baseURL: 'https://generativelanguage.googleapis.com/v1beta',
            timeout: 20000,
            envKey: 'GEMINI_API_KEY',
            keyPrefix: 'AIzaSy'
        }
    },

        // Logging Configuration - Optimized for production
    LOGGING: {
            LEVEL: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : 'info'),
        ENABLE_FILE_LOGGING: true,
        LOG_DIR: './logs',
        MAX_LOG_SIZE: '10mb',
            MAX_LOG_FILES: 5, // Reduced from 10
            ENABLE_CONSOLE_LOGGING: process.env.NODE_ENV !== 'production'
    },

    // API Endpoints
    ENDPOINTS: {
        CHAT: '/api/chat',
        STATUS: '/api/status',
        TEST: '/api/test',
        HEALTH: '/health',
        ADMIN: '/admin',
        DOCS: '/docs'
    }
    };

    return configCache;
};

// Static export for backward compatibility
export const CONFIG = getConfig();

/**
 * Validates environment variables and API keys
 * Optimized to only show warnings in development
 */
export function validateConfig() {
    const config = getConfig();
    const errors = [];
    const isProd = process.env.NODE_ENV === 'production';

    // Check if PORT is set in environment - if not, we'll use the default
    if (!process.env.PORT && !isProd) {
        console.log('⚠️  PORT environment variable not set, using default port 3002');
    }

    // Validate port number if provided
    const port = parseInt(process.env.PORT);
    if (port && (port < 1 || port > 65535)) {
        errors.push('PORT must be a valid number between 1 and 65535');
    }

    // Validate BASE_URL format if provided
    if (process.env.BASE_URL) {
        try {
            new URL(process.env.BASE_URL);
        } catch (e) {
            errors.push('BASE_URL must be a valid URL');
        }
    }

    // Validate API keys format - only in development
    if (!isProd) {
    Object.values(config.PROVIDERS).forEach(provider => {
        const apiKey = process.env[provider.envKey];
        if (apiKey && !apiKey.startsWith(provider.keyPrefix)) {
            errors.push(`${provider.envKey} should start with "${provider.keyPrefix}"`);
        }
    });
    }

    if (errors.length > 0) {
        throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }

    // Only log in development
    if (!isProd) {
    console.log('✅ Configuration validated successfully');
    }
}

/**
 * Gets available providers based on API key presence
 * Optimized with minimal environment variable lookups
 */
export function getAvailableProviders() {
    const config = getConfig();
    const availableProviders = [];
    
    for (const provider of Object.values(config.PROVIDERS)) {
        const apiKey = process.env[provider.envKey];
        if (apiKey && apiKey.length > 10) {
            availableProviders.push(provider);
        }
    }
    
    return availableProviders;
}
