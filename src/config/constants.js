/**
 * Legacy constants file - now using new config system
 * This file is maintained for backward compatibility
 */

import { CONFIG } from './config.js';

// Re-export from new config system
export const API_CONFIG = CONFIG.AI;
export const API_ENDPOINTS = CONFIG.ENDPOINTS;

// Legacy constants for backward compatibility
export const SUCCESS_MESSAGES = {
  HEALTHY: 'Service is healthy and operational'
};

export const ERROR_MESSAGES = {
  INVALID_REQUEST: 'Invalid request format',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  AUTHENTICATION_FAILED: 'Authentication failed'
};

export const DEFAULT_PROVIDER_PRIORITY = CONFIG.DEFAULT_PRIORITY;

export const OPENROUTER_MODELS = [
  {
    name: "DeepSeek R1",
    id: "deepseek/deepseek-r1:free"
  },
  {
    name: "Llama 3.1 8B",
    id: "meta-llama/llama-3.1-8b-instruct:free"
  },
  {
    name: "Mistral 7B Instruct",
    id: "mistralai/mistral-7b-instruct:free"
  },
  {
    name: "Qwen 2.5 7B",
    id: "qwen/qwen-2.5-7b-instruct:free"
  },
  {
    name: "Gemma 2 9B",
    id: "google/gemma-2-9b-it:free"
  },
  {
    name: "GPT-4o",
    id: "openai/gpt-4o"
  },
  {
    name: "GPT-4o Mini",
    id: "openai/gpt-4o-mini"
  },
  {
    name: "Claude 3.5 Sonnet",
    id: "anthropic/claude-3.5-sonnet"
  },
  {
    name: "Claude 3.5 Haiku",
    id: "anthropic/claude-3.5-haiku"
  },
  {
    name: "Gemini 1.5 Pro",
    id: "google/gemini-1.5-pro"
  },
  {
    name: "Gemini 1.5 Flash",
    id: "google/gemini-1.5-flash"
  },
  {
    name: "Mixtral 8x7B",
    id: "mistralai/mixtral-8x7b-instruct"
  }
];

// Paths and file configuration
export const PATHS = {
  GLOBAL_CONFIG: './src/config/global-config.json',
  PRIORITY_CONFIG: './priority.json',
  LOGS_DIR: './logs',
  PUBLIC_DIR: './public'
};

// Default configuration for new installations
export const DEFAULT_CONFIG = {
  provider: 'auto',
  model: 'llama3-8b-8192',
  temperature: 0.7,
  maxTokens: 1000,
  systemPrompt: CONFIG.AI.SYSTEM_PROMPT,
  activeProvider: 'auto',
  activeOpenRouterModel: 'anthropic/claude-3.5-haiku'
};
