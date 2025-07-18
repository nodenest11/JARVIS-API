/**
 * Optimized logging system for production performance
 * Reduces disk I/O and implements conditional logging based on environment
 */

import fs from 'fs';
import path from 'path';

// Configuration
const LOG_DIR = './logs';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

// Log levels with numeric values for comparison
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

// Create log directory if it doesn't exist
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// In-memory log buffer to reduce disk writes
const logBuffer = [];
let bufferTimer = null;
const BUFFER_FLUSH_INTERVAL = IS_PRODUCTION ? 10000 : 5000; // 10 seconds in production, 5 in dev
const MAX_BUFFER_SIZE = IS_PRODUCTION ? 50 : 20; // More items in production before flush

// Get current log level numeric value
const currentLogLevelValue = LOG_LEVELS[LOG_LEVEL] || LOG_LEVELS.info;

/**
 * Optimized logger with conditional logging based on environment
 */
class Logger {
  constructor() {
    this.setupLogFiles();
  }

  setupLogFiles() {
    const date = new Date().toISOString().split('T')[0];
    this.logFile = path.join(LOG_DIR, `${date}.log`);
    this.errorLogFile = path.join(LOG_DIR, `${date}-error.log`);
    
    // Rotate logs if they get too large (over 10MB)
    this.checkLogRotation();
  }
  
  checkLogRotation() {
    try {
      if (fs.existsSync(this.logFile)) {
        const stats = fs.statSync(this.logFile);
        if (stats.size > 10 * 1024 * 1024) { // 10MB
          const timestamp = new Date().toISOString().replace(/:/g, '-');
          fs.renameSync(this.logFile, `${this.logFile}.${timestamp}`);
        }
      }
      
      if (fs.existsSync(this.errorLogFile)) {
        const stats = fs.statSync(this.errorLogFile);
        if (stats.size > 10 * 1024 * 1024) { // 10MB
          const timestamp = new Date().toISOString().replace(/:/g, '-');
          fs.renameSync(this.errorLogFile, `${this.errorLogFile}.${timestamp}`);
        }
      }
    } catch (error) {
      console.error('Error rotating logs:', error);
    }
  }

  /**
   * Log a message with level and metadata
   */
  log(level, message, metadata = {}) {
    // Skip logging if level is below current log level
    if (LOG_LEVELS[level] < currentLogLevelValue) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...metadata,
      env: NODE_ENV
    };
    
    // Always console log errors in any environment
    if (level === 'error') {
      console.error(`[${timestamp}] ERROR: ${message}`, metadata);
    } 
    // Only console log in development
    else if (!IS_PRODUCTION) {
      console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
    }

    // Add to buffer
    logBuffer.push(logEntry);
    
    // Flush buffer if it's too large or on error in production
    if (logBuffer.length >= MAX_BUFFER_SIZE || (level === 'error' && IS_PRODUCTION)) {
      this.flushBuffer();
    } else if (!bufferTimer) {
      // Set timer to flush buffer periodically
      bufferTimer = setTimeout(() => this.flushBuffer(), BUFFER_FLUSH_INTERVAL);
    }
  }

  /**
   * Flush log buffer to disk
   */
  flushBuffer() {
    if (bufferTimer) {
      clearTimeout(bufferTimer);
      bufferTimer = null;
    }
    
    if (logBuffer.length === 0) return;
    
    try {
      // Group logs by file
      const regularLogs = [];
      const errorLogs = [];
      
      logBuffer.forEach(entry => {
        const logLine = JSON.stringify(entry) + '\n';
        regularLogs.push(logLine);
        
        if (entry.level === 'error') {
          errorLogs.push(logLine);
        }
      });
      
      // Write all logs to main log file
      if (regularLogs.length > 0) {
        fs.appendFileSync(this.logFile, regularLogs.join(''));
      }
      
      // Write errors to error log file
      if (errorLogs.length > 0) {
        fs.appendFileSync(this.errorLogFile, errorLogs.join(''));
      }
      
      // Clear buffer
      logBuffer.length = 0;
    } catch (error) {
      console.error('Error writing logs to file:', error);
    }
  }

  /**
   * Log debug message
   */
  debug(message, metadata = {}) {
    this.log('debug', message, metadata);
  }

  /**
   * Log info message
   */
  info(message, metadata = {}) {
    this.log('info', message, metadata);
  }

  /**
   * Log warning message
   */
  warn(message, metadata = {}) {
    this.log('warn', message, metadata);
  }

  /**
   * Log error message
   */
  error(message, metadata = {}) {
    this.log('error', message, metadata);
  }

  /**
   * Log AI request (simplified in production)
   */
  logAIRequest(provider, model, success, duration) {
    // Skip detailed AI request logging in production
    if (IS_PRODUCTION) return;
    
    this.info(`AI Request: ${provider} (${model})`, {
      success,
      duration: `${duration}ms`,
      provider,
      model
    });
  }
}

// Create singleton logger instance
export const logger = new Logger();

// Ensure logs are flushed before exit
process.on('beforeExit', () => {
  if (logBuffer.length > 0) {
    logger.flushBuffer();
  }
});
