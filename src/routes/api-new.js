/**
 * API Routes - Professional endpoint handling for AI services
 */

import express from 'express';
import AIServiceManager from '../services/aiServiceManager.js';
import { chatRequestValidator } from '../middleware/index.js';
import { createResponse, measureTime } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const aiManager = new AIServiceManager();

/**
 * POST /api/chat - Main chat endpoint with intelligent fallback
 */
router.post('/chat', chatRequestValidator, async (req, res) => {
    const { message, temperature, maxTokens } = req.body;

    logger.info('Chat request received', {
        messageLength: message.length,
        temperature,
        maxTokens
    });

    try {
        const { result, duration } = await measureTime(() =>
            aiManager.generateResponse(message, { temperature, maxTokens })
        );

        logger.info('Chat request completed successfully', {
            provider: result.provider,
            model: result.model,
            duration: `${duration}ms`,
            fallbackUsed: result.fallbackUsed
        });

        const response = createResponse(true, {
            response: result.response,
            provider: result.provider,
            model: result.model,
            fallbackUsed: result.fallbackUsed,
            totalAttempts: result.totalAttempts,
            responseTime: duration
        });

        res.json(response);

    } catch (error) {
        logger.error('Chat request failed', { error: error.message });

        const response = createResponse(false, null, {
            message: 'AI service temporarily unavailable. Please try again.',
            details: error.message
        });

        res.status(error.status || 500).json(response);
    }
});

/**
 * GET /api/status - Service status and health information
 */
router.get('/status', (req, res) => {
    try {
        const status = aiManager.getServiceStatus();

        logger.info('Status check completed', {
            availableServices: status.availableServices,
            totalServices: status.totalServices
        });

        const response = createResponse(true, {
            status: 'operational',
            ...status,
            environment: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString()
        });

        res.json(response);

    } catch (error) {
        logger.error('Status check failed', { error: error.message });

        const response = createResponse(false, null, {
            message: 'Unable to retrieve service status',
            details: error.message
        });

        res.status(500).json(response);
    }
});

/**
 * POST /api/test - Test all available AI services
 */
router.post('/test', async (req, res) => {
    logger.info('Testing all AI services');

    try {
        const { result, duration } = await measureTime(() =>
            aiManager.testAllServices()
        );

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
            details: error.message
        });

        res.status(500).json(response);
    }
});

/**
 * POST /api/test/:serviceId - Test specific AI service
 */
router.post('/test/:serviceId', async (req, res) => {
    const { serviceId } = req.params;

    logger.info(`Testing service: ${serviceId}`);

    try {
        const { result, duration } = await measureTime(() =>
            aiManager.testService(serviceId)
        );

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
            details: error.message
        });

        res.status(500).json(response);
    }
});

export default router;
