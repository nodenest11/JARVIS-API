#!/usr/bin/env node

// Test script to debug environment loading
import dotenv from 'dotenv';

console.log('🔍 Testing environment loading...\n');

// Load environment variables
dotenv.config();

console.log('Environment variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('BASE_URL:', process.env.BASE_URL);
console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY ? 'SET' : 'NOT SET');
console.log('GITHUB_TOKEN:', process.env.GITHUB_TOKEN ? 'SET' : 'NOT SET');
console.log('OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? 'SET' : 'NOT SET');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET');

console.log('\n🧪 Testing config loading...');

try {
    const { getConfig, validateConfig } = await import('./src/config/config.js');

    const config = getConfig();
    console.log('✅ Config loaded successfully');
    console.log('Config PORT:', config.SERVER.PORT);
    console.log('Config NODE_ENV:', config.SERVER.NODE_ENV);
    console.log('Config BASE_URL:', config.SERVER.BASE_URL);

    console.log('\n🔍 Testing validation...');
    validateConfig();
    console.log('✅ Validation passed');

} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}
