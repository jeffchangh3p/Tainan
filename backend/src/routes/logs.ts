import { Router, Request, Response } from 'express';
import { dbAll } from '../db/database';

const router = Router();

// GET /api/logs — Get audit log entries
router.get('/', (req: Request, res: Response): void => {
  try {
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    const logs = dbAll(
      `SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?`,
      limit
    );
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

export default router;
