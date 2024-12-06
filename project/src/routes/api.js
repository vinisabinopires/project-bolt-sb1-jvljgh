import express from 'express';
import { getEvents } from '../utils/database.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.get('/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const events = await getEvents(limit);
    res.json({ events });
  } catch (error) {
    logger.error('Error fetching logs', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const stats = {
      fileEvents: await getEvents(1, 'file'),
      httpEvents: await getEvents(1, 'http'),
      status: 'active'
    };
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching stats', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;