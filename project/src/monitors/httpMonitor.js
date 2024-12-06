import { logger } from '../utils/logger.js';
import { saveEvent } from '../utils/database.js';

const SUSPICIOUS_PATTERNS = {
  paths: [
    /\.\./,  // Directory traversal
    /[<>'"{}()]/g,  // Potential injection
    /(\/etc\/|\/var\/|\/root\/)/  // System paths
  ],
  extensions: [
    '.php', '.asp', '.aspx', '.exe', '.sh'
  ]
};

function determineSeverity(event) {
  if (event.statusCode >= 500) return 'error';
  if (event.statusCode >= 400) return 'warning';
  if (event.duration > 5000) return 'warning';
  return 'info';
}

function isSuspiciousRequest(event) {
  // Check suspicious paths
  const hasSuspiciousPath = SUSPICIOUS_PATTERNS.paths.some(pattern => 
    pattern.test(event.path)
  );

  // Check suspicious file extensions
  const hasSuspiciousExtension = SUSPICIOUS_PATTERNS.extensions.some(ext => 
    event.path.toLowerCase().endsWith(ext)
  );

  return (
    event.statusCode === 404 ||
    event.duration > 5000 ||
    event.userAgent.isBot ||
    hasSuspiciousPath ||
    hasSuspiciousExtension
  );
}

export function setupHttpMonitor(app, io) {
  app.use(async (req, res, next) => {
    const start = Date.now();

    res.on('finish', async () => {
      try {
        const duration = Date.now() - start;
        const eventData = {
          type: 'http',
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          userAgent: req.useragent,
          ip: req.ip,
          timestamp: new Date().toISOString()
        };

        if (isSuspiciousRequest(eventData)) {
          eventData.severity = determineSeverity(eventData);
          logger.warn('Suspicious HTTP activity detected', eventData);
          await saveEvent(eventData);
          io.emit('securityEvent', eventData);
        }
      } catch (error) {
        logger.error('Error processing HTTP event', { error: error.message });
      }
    });

    next();
  });
}