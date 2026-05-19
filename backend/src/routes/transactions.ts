import { Router, Request, Response } from 'express';
import { dbAll, dbGet, dbRun } from '../db/database';
import { validate, createTransactionSchema, updateTransactionSchema } from '../middleware/validation';

const router = Router();

// GET /api/transactions — List with filters
router.get('/', (req: Request, res: Response): void => {
  try {
    let query = `
      SELECT t.*, c.name as category_name, c.icon as category_icon
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (req.query.type) {
      query += ' AND t.type = ?';
      params.push(req.query.type);
    }
    if (req.query.categoryId) {
      query += ' AND t.category_id = ?';
      params.push(Number(req.query.categoryId));
    }
    if (req.query.startDate) {
      query += ' AND t.date >= ?';
      params.push(req.query.startDate);
    }
    if (req.query.endDate) {
      query += ' AND t.date <= ?';
      params.push(req.query.endDate);
    }
    if (req.query.search) {
      query += ' AND t.description LIKE ?';
      params.push(`%${req.query.search}%`);
    }
    if (req.query.person) {
      query += ' AND t.person = ?';
      params.push(req.query.person);
    }

    query += ' ORDER BY t.date DESC, t.created_at DESC';

    // Pagination
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const transactions = dbAll(query, ...params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM transactions t WHERE 1=1`;
    const countParams: any[] = [];
    if (req.query.type) {
      countQuery += ' AND t.type = ?';
      countParams.push(req.query.type);
    }
    if (req.query.categoryId) {
      countQuery += ' AND t.category_id = ?';
      countParams.push(Number(req.query.categoryId));
    }
    if (req.query.startDate) {
      countQuery += ' AND t.date >= ?';
      countParams.push(req.query.startDate);
    }
    if (req.query.endDate) {
      countQuery += ' AND t.date <= ?';
      countParams.push(req.query.endDate);
    }
    if (req.query.search) {
      countQuery += ' AND t.description LIKE ?';
      countParams.push(`%${req.query.search}%`);
    }

    const countResult = dbGet(countQuery, ...countParams);
    const total = countResult?.total || 0;

    res.json({
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// POST /api/transactions — Create
router.post('/', validate(createTransactionSchema), (req: Request, res: Response): void => {
  try {
    const { amount, type, category_id, person, description, date } = req.body;
    const result = dbRun(
      `INSERT INTO transactions (amount, type, category_id, person, description, date) VALUES (?, ?, ?, ?, ?, ?)`,
      amount, type, category_id || null, person || null, description || null, date
    );

    const transaction = dbGet(
      `SELECT t.*, c.name as category_name, c.icon as category_icon
       FROM transactions t LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = ?`,
      result.lastInsertRowid
    );

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// PUT /api/transactions/:id — Update
router.put('/:id', validate(updateTransactionSchema), (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const existing = dbGet('SELECT * FROM transactions WHERE id = ?', Number(id));
    if (!existing) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    const fields = req.body;
    const updates: string[] = [];
    const values: any[] = [];

    if (fields.amount !== undefined) { updates.push('amount = ?'); values.push(fields.amount); }
    if (fields.type !== undefined) { updates.push('type = ?'); values.push(fields.type); }
    if (fields.category_id !== undefined) { updates.push('category_id = ?'); values.push(fields.category_id); }
    if (fields.person !== undefined) { updates.push('person = ?'); values.push(fields.person); }
    if (fields.description !== undefined) { updates.push('description = ?'); values.push(fields.description); }
    if (fields.date !== undefined) { updates.push('date = ?'); values.push(fields.date); }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    updates.push("updated_at = datetime('now')");
    values.push(Number(id));

    dbRun(`UPDATE transactions SET ${updates.join(', ')} WHERE id = ?`, ...values);

    const updated = dbGet(
      `SELECT t.*, c.name as category_name, c.icon as category_icon
       FROM transactions t LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = ?`,
      Number(id)
    );

    res.json(updated);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// DELETE /api/transactions/:id — Delete
router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const result = dbRun('DELETE FROM transactions WHERE id = ?', Number(id));
    if (result.changes === 0) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

export default router;
