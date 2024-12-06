import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import useragent from 'express-useragent';
import rateLimit from 'express-rate-limit';
import { setupFileWatcher } from './monitors/fileWatcher.js';
import { setupHttpMonitor } from './monitors/httpMonitor.js';
import { logger } from './utils/logger.js';
import { initDatabase, closeDatabase } from './utils/database.js';
import { CONFIG } from './config/constants.js';
import apiRoutes from './routes/api.js';
import TestRunner from './tests/runner.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

async function startServer() {
  try {
    // Initialize database
    await initDatabase();

    // Middleware
    app.use(express.json());
    app.use(useragent.express());
    app.use(express.static(join(__dirname, 'public')));
    app.use(rateLimit(CONFIG.RATE_LIMIT));

    // API routes
    app.use('/api', apiRoutes);

    // Setup monitors
    setupFileWatcher(io);
    setupHttpMonitor(app, io);

    // Initialize and start automated tests
    const testRunner = new TestRunner();
    testRunner.startScheduledTests();

    // WebSocket connection
    io.on('connection', (socket) => {
      logger.info('Client connected to dashboard');
      
      socket.on('disconnect', () => {
        logger.info('Client disconnected from dashboard');
      });
    });

    // Start server
    httpServer.listen(CONFIG.PORT, () => {
      logger.info(`Security monitoring server running on port ${CONFIG.PORT}`);
    });

    // Handle graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down server...');
      await closeDatabase();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

startServer();