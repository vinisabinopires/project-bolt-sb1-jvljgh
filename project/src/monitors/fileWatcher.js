import chokidar from 'chokidar';
import { logger } from '../utils/logger.js';
import { saveEvent } from '../utils/database.js';
import { CONFIG } from '../config/constants.js';

export function setupFileWatcher(io) {
  const watcher = chokidar.watch('.', CONFIG.FILE_WATCH);

  const handleFileEvent = async (event, path) => {
    try {
      const timestamp = new Date().toISOString();
      const eventData = {
        type: 'file',
        event,
        path,
        timestamp,
        severity: event === 'chmod' ? 'warning' : 'info'
      };

      logger.info(`File ${event} detected`, { path });
      await saveEvent(eventData);
      io.emit('securityEvent', eventData);
    } catch (error) {
      logger.error('Error handling file event', { error: error.message, event, path });
    }
  };

  watcher
    .on('add', path => handleFileEvent('add', path))
    .on('change', path => handleFileEvent('change', path))
    .on('unlink', path => handleFileEvent('delete', path))
    .on('chmod', path => handleFileEvent('chmod', path))
    .on('error', error => {
      logger.error('File watcher error', { error: error.message });
    });

  return watcher;
}