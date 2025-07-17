/**
 * Centralized logging service with mu    formatMessage(level, message, context = {}) {
        const timestamp = new Date().toISOString();
        const contextStr = Object.keys(context).length > 0 ? JSON.stringify(context) : '';

        // Enhanced formatting for console output
        const consoleFormat = this.formatConsoleMessage(level, message, context, timestamp);
        
        return {
            timestamp,
            level: level.toUpperCase(),
            message,
            context,
            formatted: `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr ? ' ' + contextStr : ''}`,
            console: consoleFormat
        };
    }

    formatConsoleMessage(level, message, context, timestamp) {
        const time = new Date(timestamp).toLocaleTimeString();
        const color = this.colors[level] || '';
        const reset = this.colors.reset;
        
        // Different formats based on log level
        switch (level) {
            case 'error':
                return `${color}❌ ERROR${reset} [${time}] ${message}${context ? ' ' + JSON.stringify(context) : ''}`;
            case 'warn':
                return `${color}⚠️  WARN${reset} [${time}] ${message}${context ? ' ' + JSON.stringify(context) : ''}`;
            case 'info':
                // Only show specific info messages with better formatting
                if (message.includes('request') || message.includes('response') || message.includes('SUCCESS') || message.includes('FAILED')) {
                    return `${color}ℹ️  INFO${reset} [${time}] ${message}${context ? ' ' + JSON.stringify(context) : ''}`;
                }
                return null; // Don't show other info messages
            case 'debug':
                return null; // Don't show debug messages
            default:
                return `${color}${level.toUpperCase()}${reset} [${time}] ${message}${context ? ' ' + JSON.stringify(context) : ''}`;
        }
    }t formats
 */

import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config/config.js';

class Logger {
    constructor() {
        this.logDir = CONFIG.LOGGING.LOG_DIR;
        this.enableFileLogging = CONFIG.LOGGING.ENABLE_FILE_LOGGING;
        this.enableConsoleLogging = CONFIG.LOGGING.ENABLE_CONSOLE_LOGGING;
        this.logLevel = CONFIG.LOGGING.LEVEL;

        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };

        this.colors = {
            error: '\x1b[31m',
            warn: '\x1b[33m',
            info: '\x1b[36m',
            debug: '\x1b[90m',
            reset: '\x1b[0m'
        };

        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        if (this.enableFileLogging && !fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    shouldLog(level) {
        return this.levels[level] <= this.levels[this.logLevel];
    }

    formatMessage(level, message, context = {}) {
        const timestamp = new Date().toISOString();
        const contextStr = Object.keys(context).length > 0 ? JSON.stringify(context) : '';

        return {
            timestamp,
            level: level.toUpperCase(),
            message,
            context,
            formatted: `[${timestamp}] ${level.toUpperCase()}: ${message} ${contextStr}`.trim()
        };
    }

    writeToFile(logData) {
        if (!this.enableFileLogging) return;

        try {
            const logFile = path.join(this.logDir, `${logData.level.toLowerCase()}.log`);
            const logEntry = JSON.stringify(logData) + '\n';

            fs.appendFileSync(logFile, logEntry);
        } catch (error) {
            console.error('Failed to write to log file:', error.message);
        }
    }

    writeToConsole(logData) {
        if (!this.enableConsoleLogging) return;

        // Use the new console format if available
        const consoleMessage = logData.console;
        if (consoleMessage) {
            console.log(consoleMessage);
        }
    }

    log(level, message, context = {}) {
        if (!this.shouldLog(level)) return;

        const logData = this.formatMessage(level, message, context);

        this.writeToConsole(logData);
        this.writeToFile(logData);
    }

    error(message, context = {}) {
        this.log('error', message, context);
    }

    warn(message, context = {}) {
        this.log('warn', message, context);
    }

    info(message, context = {}) {
        this.log('info', message, context);
    }

    debug(message, context = {}) {
        this.log('debug', message, context);
    }

    // Request logging with improved formatting
    logRequest(req, res, duration) {
        const time = new Date().toLocaleTimeString();
        const status = res.statusCode;
        const method = req.method;
        const url = req.originalUrl;

        let icon = '📝';
        let color = this.colors.info;

        if (status >= 500) {
            icon = '❌';
            color = this.colors.error;
        } else if (status >= 400) {
            icon = '⚠️';
            color = this.colors.warn;
        } else if (status >= 200) {
            icon = '✅';
            color = this.colors.info;
        }

        const message = `${icon} ${method} ${url} → ${status} (${duration}ms)`;
        console.log(`${color}${message}${this.colors.reset}`);
    }

    // AI Service logging with improved formatting
    logAIRequest(provider, model, success, duration, error = null) {
        const time = new Date().toLocaleTimeString();
        const icon = success ? '🤖✅' : '🤖❌';
        const color = success ? this.colors.info : this.colors.error;

        let message = `${icon} ${provider} (${model}) → ${success ? 'SUCCESS' : 'FAILED'} (${duration}ms)`;

        if (error) {
            message += ` - ${error}`;
        }

        console.log(`${color}${message}${this.colors.reset}`);
    }

    // Chat request logging
    logChatRequest(message, provider, model, success, duration, fallback = false) {
        const time = new Date().toLocaleTimeString();
        const icon = success ? '💬✅' : '💬❌';
        const color = success ? this.colors.info : this.colors.error;

        const fallbackText = fallback ? ' (fallback)' : '';
        const logMessage = `${icon} Chat Request → ${provider} (${model})${fallbackText} → ${success ? 'SUCCESS' : 'FAILED'} (${duration}ms)`;

        console.log(`${color}${logMessage}${this.colors.reset}`);
    }
}

// Export singleton instance
export const logger = new Logger();
export default logger;
