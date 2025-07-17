/**
 * JARVIS AI API Server - Professional Multi-Provider AI Assistant
 * Refactored for better performance, maintainability, and scalability
 */

import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables first
dotenv.config();

// Import configurations and utilities
import { CONFIG, validateConfig } from './src/config/config.js';
import { logger } from './src/utils/logger.js';
import { createResponse } from './src/utils/helpers.js';

// Import middleware
import {
  corsMiddleware,
  requestLogger,
  errorHandler,
  rateLimiter
} from './src/middleware/index.js';

// Import routes
import apiRoutes from './src/routes/api.js';
import adminRoutes from './src/routes/admin.js';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class JarvisServer {
  constructor() {
    this.app = express();
    this.port = CONFIG.SERVER.PORT;

    this.validateEnvironment();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  validateEnvironment() {
    try {
      validateConfig();
    } catch (error) {
      logger.error('Configuration validation failed', { error: error.message });
      process.exit(1);
    }
  }

  setupMiddleware() {
    // Basic middleware
    this.app.use(express.json({ limit: CONFIG.SERVER.REQUEST_SIZE_LIMIT }));
    this.app.use(express.static('public'));

    // Security and logging middleware
    if (CONFIG.SERVER.CORS_ENABLED) {
      this.app.use(corsMiddleware);
    }

    this.app.use(requestLogger);
    this.app.use(rateLimiter(60000, 100)); // 100 requests per minute
  }

  setupRoutes() {
    // API routes
    this.app.use('/api', apiRoutes);
    this.app.use('/admin', adminRoutes);

    // Static UI routes
    this.app.get('/jarvis', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'admin.html'));
    });

    this.app.get('/jarvis/chat', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'jarvis.html'));
    });

    this.app.get('/docs', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'docs.html'));
    });

    this.app.get('/logs', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'logs.html'));
    });

    // Health check endpoint
    this.app.get(['/health', '/healthy'], (req, res) => {
      const healthData = {
        status: 'healthy',
        version: '2.0.0',
        environment: CONFIG.SERVER.NODE_ENV,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        features: {
          multiProvider: true,
          priorityFallback: true,
          professionalUI: true,
          comprehensiveLogging: true
        }
      };

      res.json(createResponse(true, healthData));
    });

    // Root endpoint
    this.app.get('/', (req, res) => {
      const apiInfo = {
        name: 'JARVIS - Professional AI API System',
        version: '2.0.0',
        description: 'Advanced multi-provider AI API with intelligent fallback',
        baseUrl: CONFIG.SERVER.BASE_URL,
        endpoints: {
          chat: '/api/chat',
          status: '/api/status',
          test: '/api/test',
          admin: '/jarvis',
          docs: '/docs'
        }
      };

      res.json(createResponse(true, apiInfo));
    });
  }

  setupErrorHandling() {
    this.app.use(errorHandler);

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Promise Rejection', { reason, promise });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });
  }

  start() {
    this.app.listen(this.port, '0.0.0.0', () => {
      logger.info(`JARVIS AI API Server started successfully`, {
        port: this.port,
        environment: CONFIG.SERVER.NODE_ENV,
        baseUrl: CONFIG.SERVER.BASE_URL
      });

      console.log(`\n🚀 JARVIS AI API Server running on port ${this.port}`);
      console.log(`🌐 Server URL: ${CONFIG.SERVER.BASE_URL}`);
      console.log(`📊 Admin Panel: ${CONFIG.SERVER.BASE_URL}/jarvis`);
      console.log(`💬 Chat Interface: ${CONFIG.SERVER.BASE_URL}/jarvis/chat`);
    });
  }
}

// Start the server
const server = new JarvisServer();
server.start();
