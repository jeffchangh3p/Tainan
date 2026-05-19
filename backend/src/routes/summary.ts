import { Router, Request, Response } from 'express';
import db from '../db/database';

const router = Router();

// GET /api/summary/monthly — Monthly income/expense totals
router.get('/monthly', (req: Request, res: Response): void => {
  try {
    const months = Number(req.query.months) || 12;

    const summary = db.prepare(`
      SELECT
        strftime('%Y-%m', date) as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
        SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net
      FROM transactions
      WHERE date >= date('now', '-' || ? || ' months')
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month ASC
    `).all(months);

    res.json(summary);
  } catch (error) {
    console.error('Error fetching monthly summary:', error);
    res.status(500).json({ error: 'Failed to fetch monthly summary' });
  }
});

// GET /api/summary/category — Breakdown by category
router.get('/category', (req: Request, res: Response): void => {
  try {
    let query = `
      SELECT
        c.id as category_id,
        c.name as category_name,
        c.icon as category_icon,
        t.type,
        SUM(t.amount) as total,
        COUNT(*) as count
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (req.query.type) {
      query += ' AND t.type = ?';
      params.push(req.query.type);
    }
    if (req.query.startDate) {
      query += ' AND t.date >= ?';
      params.push(req.query.startDate);
    }
    if (req.query.endDate) {
      query += ' AND t.date <= ?';
      params.push(req.query.endDate);
    }

    query += ' GROUP BY c.id, t.type ORDER BY total DESC';

    const summary = db.prepare(query).all(...params);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching category summary:', error);
    res.status(500).json({ error: 'Failed to fetch category summary' });
  }
});

// GET /api/summary/overview — Quick overview stats
router.get('/overview', (_req: Request, res: Response): void => {
  try {
    const currentMonth = db.prepare(`
      SELECT
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as month_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as month_expense
      FROM transactions
      WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
    `).get() as any;

    const allTime = db.prepare(`
      SELECT
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
        COUNT(*) as total_transactions
      FROM transactions
    `).get() as any;

    res.json({
      currentMonth: {
        income: currentMonth?.month_income || 0,
        expense: currentMonth?.month_expense || 0,
        balance: (currentMonth?.month_income || 0) - (currentMonth?.month_expense || 0),
      },
      allTime: {
        income: allTime?.total_income || 0,
        expense: allTime?.total_expense || 0,
        balance: (allTime?.total_income || 0) - (allTime?.total_expense || 0),
        transactions: allTime?.total_transactions || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching overview:', error);
    res.status(500).json({ error: 'Failed to fetch overview' });
  }
});

export default router;
