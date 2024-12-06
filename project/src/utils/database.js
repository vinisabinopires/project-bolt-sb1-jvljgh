import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { CONFIG } from '../config/constants.js';
import { logger } from './logger.js';

let db;

function createDatabase() {
  return new Promise((resolve, reject) => {
    const newDb = new sqlite3.Database(CONFIG.DB_PATH, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(newDb);
    });
  });
}

export async function initDatabase() {
  try {
    // Close existing connection if any
    if (db) {
      await new Promise((resolve, reject) => {
        db.close((err) => err ? reject(err) : resolve());
      });
    }

    // Create new connection
    db = await createDatabase();
    const run = promisify(db.run.bind(db));
    
    // Drop existing table to ensure clean schema
    await run('DROP TABLE IF EXISTS security_events');
    
    // Create table with updated schema
    await run(`
      CREATE TABLE security_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        event TEXT NOT NULL,
        details TEXT,
        severity TEXT NOT NULL DEFAULT 'info',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Database initialization failed', { error: error.message });
    throw error;
  }
}

export async function saveEvent(eventData) {
  if (!db) {
    await initDatabase();
  }

  const run = promisify(db.run.bind(db));
  
  try {
    await run(
      'INSERT INTO security_events (type, event, details, severity, timestamp) VALUES (?, ?, ?, ?, ?)',
      [
        eventData.type,
        eventData.event,
        JSON.stringify(eventData),
        eventData.severity || 'info',
        eventData.timestamp || new Date().toISOString()
      ]
    );
  } catch (error) {
    logger.error('Failed to save event', { error: error.message, event: eventData });
    // Don't throw the error - log and continue
  }
}

export async function getEvents(limit = 100, type = null) {
  if (!db) {
    await initDatabase();
  }

  const all = promisify(db.all.bind(db));
  
  try {
    const query = type 
      ? 'SELECT * FROM security_events WHERE type = ? ORDER BY timestamp DESC LIMIT ?'
      : 'SELECT * FROM security_events ORDER BY timestamp DESC LIMIT ?';
    
    const params = type ? [type, limit] : [limit];
    return await all(query, params);
  } catch (error) {
    logger.error('Failed to fetch events', { error: error.message });
    return [];
  }
}

// Cleanup function for graceful shutdown
export async function closeDatabase() {
  if (db) {
    await new Promise((resolve) => {
      db.close((err) => {
        if (err) {
          logger.error('Error closing database', { error: err.message });
        }
        resolve();
      });
    });
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDatabase();
  process.exit(0);
});