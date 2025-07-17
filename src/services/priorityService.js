/**
 * Priority Service - Manages AI model priority based on priority.json
 * Simple file-based priority management with no token/timeout restrictions
 */

import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';

const PRIORITY_FILE = 'priority.json';

let priorityConfig = null;

/**
 * Load priority configuration from priority.json
 */
export function loadPriorityConfig() {
    try {
        if (!fs.existsSync(PRIORITY_FILE)) {
            throw new Error('Priority configuration file not found. Please create priority.json file.');
        }

        const data = fs.readFileSync(PRIORITY_FILE, 'utf8');
        priorityConfig = JSON.parse(data);

        // Validate required structure
        if (!priorityConfig.providers || !Array.isArray(priorityConfig.providers)) {
            throw new Error('Invalid priority.json: providers array is required');
        }

        logger.info('Priority configuration loaded successfully');
        return priorityConfig;
    } catch (error) {
        logger.error('Failed to load priority configuration', { error: error.message });
        throw error;
    }
}

/**
 * Reload priority configuration (clears cache)
 */
export function reloadPriorityConfig() {
    priorityConfig = null;
    return loadPriorityConfig();
}

/**
 * Get ordered providers based on priority
 */
export function getOrderedProviders() {
    const config = priorityConfig || loadPriorityConfig();

    return config.providers
        .filter(provider => provider.enabled)
        .sort((a, b) => a.priority - b.priority);
}

/**
 * Get provider configuration by ID
 */
export function getProviderConfig(providerId) {
    const config = priorityConfig || loadPriorityConfig();

    const provider = config.providers.find(p => p.id === providerId);
    if (!provider) {
        throw new Error(`Provider ${providerId} not found in priority configuration`);
    }

    return provider;
}

/**
 * Get priority settings (no restrictions)
 */
export function getPrioritySettings() {
    const config = priorityConfig || loadPriorityConfig();

    return {
        noTimeoutRestrictions: config.settings?.noTimeoutRestrictions || true,
        noTokenLimits: config.settings?.noTokenLimits || true,
        allowCompleteResponse: config.settings?.allowCompleteResponse || true,
        maxTokens: null, // No token limit
        timeoutThreshold: null, // No timeout
        retryCount: 1 // Only try once per provider
    };
}

/**
 * Get priority order of providers
 */
export function getPriorityOrder() {
    try {
        const config = priorityConfig || loadPriorityConfig();
        return config.providers
            .filter(p => p.enabled)
            .sort((a, b) => a.priority - b.priority)
            .map(p => p.id);
    } catch (error) {
        logger.error('Failed to get priority order', { error: error.message });
        return ['gemini', 'groq', 'github', 'openrouter']; // fallback order
    }
}

/**
 * Update provider priority
 */
export function updateProviderPriority(providerId, newPriority) {
    try {
        const config = priorityConfig || loadPriorityConfig();

        const provider = config.providers.find(p => p.id === providerId);
        if (!provider) {
            throw new Error(`Provider ${providerId} not found`);
        }

        provider.priority = newPriority;
        config.lastUpdated = new Date().toISOString();

        // Save to file
        fs.writeFileSync(PRIORITY_FILE, JSON.stringify(config, null, 2));
        priorityConfig = config;

        logger.info(`Updated priority for ${providerId} to ${newPriority}`);
        return config;
    } catch (error) {
        logger.error('Failed to update provider priority', {
            providerId,
            newPriority,
            error: error.message
        });
        throw error;
    }
}

/**
 * Enable/disable a provider
 */
export function toggleProvider(providerId, enabled) {
    try {
        const config = priorityConfig || loadPriorityConfig();

        const provider = config.providers.find(p => p.id === providerId);
        if (!provider) {
            throw new Error(`Provider ${providerId} not found`);
        }

        provider.enabled = enabled;
        config.lastUpdated = new Date().toISOString();

        // Save to file
        fs.writeFileSync(PRIORITY_FILE, JSON.stringify(config, null, 2));
        priorityConfig = config;

        logger.info(`${enabled ? 'Enabled' : 'Disabled'} provider ${providerId}`);
        return config;
    } catch (error) {
        logger.error('Failed to toggle provider', {
            providerId,
            enabled,
            error: error.message
        });
        throw error;
    }
}

/**
 * Get model for specific provider from priority.json
 */
export function getProviderModel(providerId) {
    const config = priorityConfig || loadPriorityConfig();
    const provider = config.providers.find(p => p.id === providerId);

    if (!provider) {
        throw new Error(`Provider ${providerId} not found in priority configuration`);
    }

    return provider.model;
}

// Load configuration on module import
loadPriorityConfig();
