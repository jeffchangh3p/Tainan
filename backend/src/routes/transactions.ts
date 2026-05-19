import { Router, Request, Response } from 'express';
import { dbAll, dbGet, dbRun } from '../db/database';
import { validate, createTransactionSchema, updateTransactionSchema } from '../middleware/validation';

const router = Router();

// Helper: write to audit log (fire-and-forget)
function logAction(action: string, detail?: string): void {
  dbRun('INSERT INTO audit_log (action, detail) VALUES (?, ?)', action, detail || null)
    .catch(e => console.error('Audit log error:', e));
}

// GET /api/transactions — List with filters
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    let query = `
      SELECT t.*, c.name as category_name, c.icon as category_icon
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (req.query.type) { query += ' AND t.type = ?'; params.push(req.query.type); }
    if (req.query.categoryId) { query += ' AND t.category_id = ?'; params.push(Number(req.query.categoryId)); }
    if (req.query.startDate) { query += ' AND t.date >= ?'; params.push(req.query.startDate); }
    if (req.query.endDate) { query += ' AND t.date <= ?'; params.push(req.query.endDate); }
    if (req.query.search) { query += ' AND t.description LIKE ?'; params.push(`%${req.query.search}%`); }
    if (req.query.person) { query += ' AND t.person = ?'; params.push(req.query.person); }

    query += ' ORDER BY t.date DESC, t.created_at DESC';

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const transactions = await dbAll(query, ...params);

    let countQuery = `SELECT COUNT(*) as total FROM transactions t WHERE 1=1`;
    const countParams: any[] = [];
    if (req.query.type) { countQuery += ' AND t.type = ?'; countParams.push(req.query.type); }
    if (req.query.categoryId) { countQuery += ' AND t.category_id = ?'; countParams.push(Number(req.query.categoryId)); }
    if (req.query.startDate) { countQuery += ' AND t.date >= ?'; countParams.push(req.query.startDate); }
    if (req.query.endDate) { countQuery += ' AND t.date <= ?'; countParams.push(req.query.endDate); }
    if (req.query.search) { countQuery += ' AND t.description LIKE ?'; countParams.push(`%${req.query.search}%`); }

    const countResult = await dbGet(countQuery, ...countParams);
    const total = Number(countResult?.total) || 0;

    res.json({
      data: transactions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// POST /api/transactions — Create
router.post('/', validate(createTransactionSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, type, category_id, person, description, receipt_image, voice_memo, date } = req.body;
    const result = await dbRun(
      `INSERT INTO transactions (amount, type, category_id, person, description, receipt_image, voice_memo, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      amount, type, category_id || null, person || null, description || null, receipt_image || null, voice_memo || null, date
    );

    const transaction = await dbGet(
      `SELECT t.*, c.name as category_name, c.icon as category_icon
       FROM transactions t LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = ?`,
      result.lastInsertRowid
    );

    res.status(201).json(transaction);
    logAction('CREATE', `NT$${amount} ${type} — ${transaction?.category_name || 'N/A'} — ${transaction?.person || ''} — ${date}`);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// PUT /api/transactions/:id — Update
router.put('/:id', validate(updateTransactionSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = await dbGet('SELECT * FROM transactions WHERE id = ?', Number(id));
    if (!existing) { res.status(404).json({ error: 'Transaction not found' }); return; }

    const fields = req.body;
    const updates: string[] = [];
    const values: any[] = [];

    if (fields.amount !== undefined) { updates.push('amount = ?'); values.push(fields.amount); }
    if (fields.type !== undefined) { updates.push('type = ?'); values.push(fields.type); }
    if (fields.category_id !== undefined) { updates.push('category_id = ?'); values.push(fields.category_id); }
    if (fields.person !== undefined) { updates.push('person = ?'); values.push(fields.person); }
    if (fields.description !== undefined) { updates.push('description = ?'); values.push(fields.description); }
    if (fields.receipt_image !== undefined) { updates.push('receipt_image = ?'); values.push(fields.receipt_image); }
    if (fields.voice_memo !== undefined) { updates.push('voice_memo = ?'); values.push(fields.voice_memo); }
    if (fields.date !== undefined) { updates.push('date = ?'); values.push(fields.date); }

    if (updates.length === 0) { res.status(400).json({ error: 'No fields to update' }); return; }

    updates.push("updated_at = datetime('now')");
    values.push(Number(id));

    await dbRun(`UPDATE transactions SET ${updates.join(', ')} WHERE id = ?`, ...values);

    const updated = await dbGet(
      `SELECT t.*, c.name as category_name, c.icon as category_icon
       FROM transactions t LEFT JOIN categories c ON t.category_id = c.id WHERE t.id = ?`,
      Number(id)
    );

    res.json(updated);
    logAction('UPDATE', `#${id} → NT$${updated?.amount} ${updated?.type} — ${updated?.person || ''} — ${updated?.date}`);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// DELETE /api/transactions/:id — Delete
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await dbRun('DELETE FROM transactions WHERE id = ?', Number(id));
    if (result.changes === 0) { res.status(404).json({ error: 'Transaction not found' }); return; }
    res.json({ message: 'Transaction deleted' });
    logAction('DELETE', `#${id}`);
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// GET /api/transactions/export — Export all as CSV
router.get('/export', async (_req: Request, res: Response): Promise<void> => {
  try {
    const transactions = await dbAll(`
      SELECT t.date, t.type, t.amount, t.person, c.name as category_name, t.description
      FROM transactions t LEFT JOIN categories c ON t.category_id = c.id
      ORDER BY t.date DESC, t.created_at DESC
    `);

    const BOM = '\uFEFF';
    const header = 'date,type,amount,person,category,description';
    const rows = transactions.map((t: any) => {
      const desc = (t.description || '').replace(/"/g, '""');
      const cat = (t.category_name || '').replace(/"/g, '""');
      const person = (t.person || '').replace(/"/g, '""');
      return `${t.date},${t.type},${t.amount},"${person}","${cat}","${desc}"`;
    });

    const csv = BOM + header + '\n' + rows.join('\n');
    const today = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="tainan_${today}.csv"`);
    res.send(csv);
    logAction('EXPORT', `${transactions.length} records exported`);
  } catch (error) {
    console.error('Error exporting:', error);
    res.status(500).json({ error: 'Failed to export' });
  }
});

// POST /api/transactions/import — Import from CSV
router.post('/import', async (req: Request, res: Response): Promise<void> => {
  try {
    const { csv } = req.body;
    if (!csv || typeof csv !== 'string') { res.status(400).json({ error: 'Missing csv field' }); return; }

    const raw = csv.replace(/^\uFEFF/, '');
    const lines = raw.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) { res.status(400).json({ error: 'CSV must have header + at least 1 data row' }); return; }

    const header = lines[0].toLowerCase().split(',').map(h => h.trim());
    const dateIdx = header.indexOf('date');
    const typeIdx = header.indexOf('type');
    const amountIdx = header.indexOf('amount');
    const personIdx = header.indexOf('person');
    const categoryIdx = header.indexOf('category');
    const descIdx = header.indexOf('description');

    if (dateIdx < 0 || typeIdx < 0 || amountIdx < 0) {
      res.status(400).json({ error: 'CSV must have date, type, amount columns' }); return;
    }

    const categories = await dbAll('SELECT id, name, type FROM categories');
    const catMap = new Map<string, number>();
    for (const c of categories) catMap.set((c as any).name, (c as any).id);

    let imported = 0, skipped = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const fields = parseCSVLine(lines[i]);
        const date = fields[dateIdx]?.trim();
        const type = fields[typeIdx]?.trim();
        const amount = parseFloat(fields[amountIdx]?.trim());
        const person = personIdx >= 0 ? fields[personIdx]?.trim() || null : null;
        const category = categoryIdx >= 0 ? fields[categoryIdx]?.trim() || null : null;
        const description = descIdx >= 0 ? fields[descIdx]?.trim() || null : null;

        if (!date || !type || !amount || amount <= 0) { skipped++; errors.push(`Row ${i+1}: invalid`); continue; }
        if (type !== 'income' && type !== 'expense') { skipped++; continue; }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { skipped++; continue; }

        const categoryId = category ? (catMap.get(category) || null) : null;
        await dbRun('INSERT INTO transactions (amount, type, category_id, person, description, date) VALUES (?, ?, ?, ?, ?, ?)',
          amount, type, categoryId, person, description, date);
        imported++;
      } catch (rowErr) { skipped++; errors.push(`Row ${i+1}: ${String(rowErr)}`); }
    }

    res.json({ message: `Imported ${imported} records, skipped ${skipped}`, imported, skipped, errors: errors.slice(0, 10) });
    logAction('IMPORT', `${imported} imported, ${skipped} skipped`);
  } catch (error) {
    console.error('Error importing:', error);
    res.status(500).json({ error: 'Failed to import' });
  }
});

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { fields.push(current); current = ''; }
      else { current += ch; }
    }
  }
  fields.push(current);
  return fields;
}

// GET /api/transactions/backup — Full JSON backup
router.get('/backup', async (_req: Request, res: Response): Promise<void> => {
  try {
    const transactions = await dbAll(`SELECT t.*, c.name as category_name, c.icon as category_icon FROM transactions t LEFT JOIN categories c ON t.category_id = c.id ORDER BY t.date DESC`);
    const categories = await dbAll('SELECT * FROM categories ORDER BY id');
    const auditLog = await dbAll('SELECT * FROM audit_log ORDER BY created_at DESC');

    const backup = { version: 1, exported_at: new Date().toISOString(), transactions, categories, audit_log: auditLog };
    const today = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="tainan_backup_${today}.json"`);
    res.json(backup);
    logAction('BACKUP_EXPORT', `${transactions.length} transactions, ${auditLog.length} logs`);
  } catch (error) {
    console.error('Error exporting backup:', error);
    res.status(500).json({ error: 'Failed to export backup' });
  }
});

// POST /api/transactions/restore — Restore from JSON backup
router.post('/restore', async (req: Request, res: Response): Promise<void> => {
  try {
    const backup = req.body;
    if (!backup?.transactions || !Array.isArray(backup.transactions)) {
      res.status(400).json({ error: 'Invalid backup format' }); return;
    }

    const existingCats = await dbAll('SELECT id, name, type FROM categories') as any[];
    const catMap = new Map<string, number>();
    for (const c of existingCats) catMap.set(c.name, c.id);

    let catsCreated = 0;
    if (backup.categories && Array.isArray(backup.categories)) {
      for (const cat of backup.categories) {
        if (!catMap.has(cat.name)) {
          const result = await dbRun('INSERT INTO categories (name, type, icon) VALUES (?, ?, ?)', cat.name, cat.type, cat.icon || null);
          catMap.set(cat.name, Number(result.lastInsertRowid));
          catsCreated++;
        }
      }
    }

    let imported = 0, skipped = 0;
    for (const tx of backup.transactions) {
      try {
        const amount = parseFloat(tx.amount);
        if (!amount || amount <= 0 || !tx.date || !tx.type) { skipped++; continue; }
        if (tx.type !== 'income' && tx.type !== 'expense') { skipped++; continue; }

        let categoryId = null;
        if (tx.category_name && catMap.has(tx.category_name)) categoryId = catMap.get(tx.category_name);
        else if (tx.category_id) categoryId = tx.category_id;

        await dbRun(
          `INSERT INTO transactions (amount, type, category_id, person, description, receipt_image, voice_memo, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          amount, tx.type, categoryId, tx.person || null, tx.description || null,
          tx.receipt_image || null, tx.voice_memo || null, tx.date
        );
        imported++;
      } catch { skipped++; }
    }

    let logsImported = 0;
    if (backup.audit_log && Array.isArray(backup.audit_log)) {
      for (const log of backup.audit_log) {
        try {
          if (!log.action) continue;
          if (log.created_at) await dbRun('INSERT INTO audit_log (action, detail, created_at) VALUES (?, ?, ?)', log.action, log.detail || null, log.created_at);
          else await dbRun('INSERT INTO audit_log (action, detail) VALUES (?, ?)', log.action, log.detail || null);
          logsImported++;
        } catch { /* skip */ }
      }
    }

    const msg = `Restored ${imported} transactions, ${catsCreated} categories, ${logsImported} logs (skipped ${skipped})`;
    logAction('BACKUP_RESTORE', msg);
    res.json({ message: msg, imported, catsCreated, logsImported, skipped });
  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ error: 'Failed to restore backup' });
  }
});

export default router;
