import fs from 'fs/promises';
import path from 'path';
import temp from 'temp';
import { logger } from '../utils/logger.js';
import { CONFIG } from '../config/constants.js';

// Track temporary files for cleanup
temp.track();

export class FileSystemTests {
  constructor() {
    this.tempDir = CONFIG.TEST.TEMP_DIR;
  }

  async setup() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      logger.info('Test directory created', { dir: this.tempDir });
    } catch (error) {
      logger.error('Failed to create test directory', { error: error.message });
    }
  }

  async cleanup() {
    try {
      await fs.rm(this.tempDir, { recursive: true, force: true });
      logger.info('Test directory cleaned up');
    } catch (error) {
      logger.error('Failed to cleanup test directory', { error: error.message });
    }
  }

  async runTests() {
    try {
      // Test file creation
      const testFile = path.join(this.tempDir, 'test.txt');
      await fs.writeFile(testFile, 'Test content');
      logger.info('Test file created', { file: testFile });

      // Test file modification
      await fs.appendFile(testFile, '\nModified content');
      logger.info('Test file modified', { file: testFile });

      // Test file permission change
      await fs.chmod(testFile, 0o644);
      logger.info('Test file permissions changed', { file: testFile });

      // Test file deletion
      await fs.unlink(testFile);
      logger.info('Test file deleted', { file: testFile });

    } catch (error) {
      logger.error('File system test failed', { error: error.message });
    }
  }
}