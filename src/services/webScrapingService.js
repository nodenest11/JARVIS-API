import fetch from 'node-fetch';
import { logger } from '../utils/logger.js';
import { CONFIG } from '../config/config.js';

class WebScrapingService {
    constructor() {
        this.baseURL = CONFIG.WEB_SCRAPING.API_URL;
        this.timeout = CONFIG.WEB_SCRAPING.TIMEOUT;
        this.maxResults = CONFIG.WEB_SCRAPING.MAX_RESULTS;
    }

    async isAvailable() {
        try {
            const response = await fetch(`${this.baseURL}/health`, { method: 'GET', timeout: 5000 });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    async search(query) {
        const startTime = Date.now();
        const searchData = { q: query, engine: 'google', num: this.maxResults, country: 'us' };

        const response = await fetch(`${this.baseURL}/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(searchData),
            timeout: this.timeout
        });

        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        
        const result = await response.json();
        return {
            success: true,
            data: {
                searchQuery: query,
                searchEngine: 'google',
                totalResults: result.organic_results?.length || 0,
                searchTime: (Date.now() - startTime) / 1000,
                sources: this.formatResults(result.organic_results || []),
                relatedQuestions: result.related_questions || []
            }
        };
    }

    formatResults(results) {
        return results.slice(0, this.maxResults).map((result, index) => ({
            position: index + 1,
            title: result.title || 'No title',
            url: result.link || '',
            snippet: result.snippet || 'No description',
            displayLink: result.displayed_link || new URL(result.link || 'http://example.com').hostname
        }));
    }
}

export default WebScrapingService;
