/**
 * Centralized configuration management for JARVIS AI API
 * All configuration values are defined here for consistency
 */

export const CONFIG = {
    // Server Configuration
    SERVER: {
        PORT: process.env.PORT || 3000,
        NODE_ENV: process.env.NODE_ENV || 'development',
        BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
        REQUEST_SIZE_LIMIT: '10mb',
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
        MAX_RETRIES: 2,
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

    // Logging Configuration
    LOGGING: {
        LEVEL: process.env.LOG_LEVEL || 'info',
        ENABLE_FILE_LOGGING: true,
        LOG_DIR: './logs',
        MAX_LOG_SIZE: '10mb',
        MAX_LOG_FILES: 10,
        ENABLE_CONSOLE_LOGGING: true
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

/**
 * Validates environment variables and API keys
 */
export function validateConfig() {
    const errors = [];

    // Check required environment variables
    if (!CONFIG.SERVER.PORT) {
        errors.push('PORT environment variable is required');
    }

    // Validate API keys format
    Object.values(CONFIG.PROVIDERS).forEach(provider => {
        const apiKey = process.env[provider.envKey];
        if (apiKey && !apiKey.startsWith(provider.keyPrefix)) {
            errors.push(`${provider.envKey} should start with "${provider.keyPrefix}"`);
        }
    });

    if (errors.length > 0) {
        throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
}

/**
 * Gets available providers based on API key presence
 */
export function getAvailableProviders() {
    return Object.values(CONFIG.PROVIDERS).filter(provider => {
        const apiKey = process.env[provider.envKey];
        return apiKey && apiKey.length > 10;
    });
}
