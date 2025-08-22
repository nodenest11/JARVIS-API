import dotenv from 'dotenv';
dotenv.config();

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';

import { getConfig, validateConfig } from './src/config/config.js';
import { logger } from './src/utils/logger.js';
import { createResponse } from './src/utils/helpers.js';

import {
  corsMiddleware,
  requestLogger,
  errorHandler,
  rateLimiter
} from './src/middleware/index.js';

import apiRoutes from './src/routes/api.js';
import adminRoutes from './src/routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class JarvisServer {
  constructor() {
    this.app = express();
    this.config = getConfig();
    this.port = this.config.SERVER.PORT;

    this.validateEnvironment();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  validateEnvironment() {
    try {
      validateConfig();

      // Minimal logging in production
      if (process.env.NODE_ENV === 'production') {
        console.log(`🔧 Environment: ${process.env.NODE_ENV}, Port: ${this.port}`);
      } else {
      console.log('🔧 Environment Configuration:');
      console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
        console.log(`   PORT: ${this.port}`);
        console.log(`   BASE_URL: ${this.config.SERVER.BASE_URL}`);
      console.log('');
      }
    } catch (error) {
      logger.error('Configuration validation failed', { error: error.message });
      console.error('❌ Failed to start JARVIS API:', error.message);
      process.exit(1);
    }
  }

  setupMiddleware() {
    // Performance optimizations
    this.app.use(compression()); // Add compression for all responses
    
    // Basic middleware - increase parse limit only if needed
    this.app.use(express.json({ 
      limit: this.config.SERVER.REQUEST_SIZE_LIMIT,
      strict: true 
    }));
    
    // Serve static files with cache headers
    this.app.use(express.static('public', {
      maxAge: '1d', // Cache static assets for 1 day
      etag: true,
      lastModified: true
    }));

    // Security and logging middleware
    if (this.config.SERVER.CORS_ENABLED) {
      this.app.use(corsMiddleware);
    }

    // Only use request logger in non-production environments
    if (process.env.NODE_ENV !== 'production') {
    this.app.use(requestLogger);
    }
    
    // More aggressive rate limiting in production
    const requestsPerMinute = process.env.NODE_ENV === 'production' ? 60 : 100;
    this.app.use(rateLimiter(60000, requestsPerMinute));
  }

  setupRoutes() {
    // API routes
    this.app.use('/api', apiRoutes);
    this.app.use('/admin', adminRoutes);

    // Static UI routes - simplified for production
    const sendFile = (file) => (req, res) => {
      res.sendFile(path.join(__dirname, 'public', file));
    };

    this.app.get('/jarvis', sendFile('admin.html'));
    this.app.get('/jarvis/chat', sendFile('jarvis.html'));
    this.app.get('/docs', sendFile('docs.html'));
    this.app.get('/logs', sendFile('logs.html'));

    // Health check endpoint - simplified for performance
    this.app.get(['/health', '/healthy'], (req, res) => {
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        data: {
        status: 'healthy',
        version: '2.0.0',
        environment: this.config.SERVER.NODE_ENV,
          port: this.port
        }
      });
    });

    // Root endpoint - simplified
    this.app.get('/', (req, res) => {
      res.json(createResponse(true, {
        name: 'JARVIS - Professional AI API System',
        version: '2.0.0',
        baseUrl: this.config.SERVER.BASE_URL,
        port: this.port
      }));
    });
  }

  setupErrorHandling() {
    this.app.use(errorHandler);

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Promise Rejection', { reason });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error: error.message });
      // Give time for logger to write before exiting
      setTimeout(() => process.exit(1), 1000);
    });
  }

  start() {
    const host = '0.0.0.0';

    this.app.listen(this.port, host, () => {
      logger.info(`JARVIS AI API Server started`, {
        port: this.port,
        environment: this.config.SERVER.NODE_ENV
      });

      console.log(`🚀 JARVIS AI API running on port ${this.port} (${this.config.SERVER.NODE_ENV})`);
    });
  }
}

// Start the server
const server = new JarvisServer();
server.start();
