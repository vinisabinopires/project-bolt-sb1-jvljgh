import fetch from 'node-fetch';
import { logger } from '../utils/logger.js';
import { CONFIG } from '../config/constants.js';

export class HttpTests {
  constructor(baseUrl = `http://localhost:${CONFIG.PORT}`) {
    this.baseUrl = baseUrl;
  }

  async runTests() {
    for (const pattern of CONFIG.TEST.HTTP_PATTERNS) {
      try {
        const response = await fetch(`${this.baseUrl}${pattern.path}`, {
          method: pattern.method,
          headers: {
            'Content-Type': 'application/json',
            ...pattern.headers
          },
          body: pattern.body ? JSON.stringify(pattern.body) : undefined
        });

        logger.info('HTTP test completed', {
          path: pattern.path,
          method: pattern.method,
          status: response.status
        });

      } catch (error) {
        logger.error('HTTP test failed', {
          path: pattern.path,
          error: error.message
        });
      }
    }
  }
}