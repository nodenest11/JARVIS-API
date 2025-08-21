/**
 * Admin Routes - Simplified for the refactored system
 */

import express from 'express';
import { CONFIG } from '../config/config.js';
import { createResponse } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Get admin panel data
router.get('/data', (req, res) => {
  try {
    const adminData = {
      providers: CONFIG.DEFAULT_PRIORITY,
      models: CONFIG.OPENROUTER_MODELS || [],
      currentConfig: {
        temperature: CONFIG.AI.DEFAULT_TEMPERATURE,
        maxTokens: CONFIG.AI.DEFAULT_MAX_TOKENS,
        timeout: CONFIG.AI.REQUEST_TIMEOUT
      }
    };

    logger.info('Admin data requested');
    
    const response = createResponse(true, adminData);
    res.json(response);

  } catch (error) {
    logger.error('Admin data request failed', { error: error.message });
    
    const response = createResponse(false, null, {
      message: 'Unable to retrieve admin data',
      details: error.message
    });
    
    res.status(500).json(response);
  }
});

// Get system logs
router.get('/logs', (req, res) => {
  try {
    const logs = {
      message: 'Log viewing is available through the /logs endpoint',
      timestamp: new Date().toISOString()
    };

    const response = createResponse(true, logs);
    res.json(response);

  } catch (error) {
    logger.error('Log request failed', { error: error.message });
    
    const response = createResponse(false, null, {
      message: 'Unable to retrieve logs',
      details: error.message
    });
    
    res.status(500).json(response);
  }
});

// Update configuration (placeholder for future implementation)
router.post('/config', (req, res) => {
  try {
    logger.info('Configuration update requested', { body: req.body });
    
    const response = createResponse(true, {
      message: 'Configuration update received',
      note: 'Configuration updates will be implemented in future versions'
    });
    
    res.json(response);

  } catch (error) {
    logger.error('Configuration update failed', { error: error.message });
    
    const response = createResponse(false, null, {
      message: 'Configuration update failed',
      details: error.message
    });
    
    res.status(500).json(response);
  }
});

export default router;
