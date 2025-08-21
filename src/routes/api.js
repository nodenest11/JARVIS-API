import express from 'express';
import AIServiceManager from '../services/aiServiceManager.js';
import { chatRequestValidator } from '../middleware/index.js';
import { createResponse } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const aiManager = new AIServiceManager();

router.post('/chat', chatRequestValidator, async (req, res) => {
  const { message, hybridMode = true } = req.body;
  const startTime = Date.now();

  try {
    const result = await aiManager.generateResponse(message, { hybridMode });
    const duration = Date.now() - startTime;

    res.json(createResponse(true, {
      response: result.response,
      provider: result.provider,
      model: result.model,
      fallbackUsed: result.fallbackUsed,
      totalAttempts: result.totalAttempts,
      responseTime: duration,
      settings: { noTimeoutRestrictions: true, noTokenLimits: true, allowCompleteResponse: true },
      ...(result.webData && { webData: result.webData }),
      metadata: result.metadata || {}
    }));

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Chat failed', { error: error.message, duration: `${duration}ms` });
    res.status(500).json(createResponse(false, null, error.message));
  }
});

router.get('/status', async (req, res) => {
  try {
    const services = aiManager.getAvailableServices();
    const webServiceAvailable = aiManager.hybridService ? 
      await aiManager.hybridService.webService.isAvailable() : false;

    res.json(createResponse(true, {
      status: 'operational',
      timestamp: new Date().toISOString(),
      services: {
        ai: { available: services.length > 0, providers: services.map(s => ({ name: s.name, available: true })) },
        webSearch: { available: webServiceAvailable, status: webServiceAvailable ? 'online' : 'offline' }
      },
      features: { hybridMode: true, intelligentDecisions: true, webSearch: webServiceAvailable }
    }));
  } catch (error) {
    res.status(500).json(createResponse(false, null, 'Status check failed'));
  }
});

export default router;
