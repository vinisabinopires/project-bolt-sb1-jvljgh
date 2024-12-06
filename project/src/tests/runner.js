import { FileSystemTests } from './fileSystemTests.js';
import { HttpTests } from './httpTests.js';
import { logger } from '../utils/logger.js';
import { CONFIG } from '../config/constants.js';

class TestRunner {
  constructor() {
    this.fileTests = new FileSystemTests();
    this.httpTests = new HttpTests();
  }

  async runAllTests() {
    logger.info('Starting automated security tests');

    try {
      // Setup test environment
      await this.fileTests.setup();

      // Run tests
      await Promise.all([
        this.fileTests.runTests(),
        this.httpTests.runTests()
      ]);

      // Cleanup
      await this.fileTests.cleanup();

      logger.info('Security tests completed');
    } catch (error) {
      logger.error('Test runner failed', { error: error.message });
    }
  }

  startScheduledTests() {
    // Run tests immediately
    this.runAllTests();

    // Schedule periodic tests
    setInterval(() => {
      this.runAllTests();
    }, CONFIG.TEST.INTERVAL);

    logger.info('Automated testing scheduled', {
      interval: `${CONFIG.TEST.INTERVAL / 1000} seconds`
    });
  }
}

// Start the test runner if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new TestRunner();
  runner.startScheduledTests();
}

export default TestRunner;