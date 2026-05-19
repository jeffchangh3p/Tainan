import { Router, Request, Response } from 'express';
import { dbAll, dbRun } from '../db/database';

const router = Router();

// GET /api/logs — Get audit log entries
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    const logs = await dbAll('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?', limit);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// GET /api/logs/export — Export all logs as CSV
router.get('/export', async (_req: Request, res: Response): Promise<void> => {
  try {
    const logs = await dbAll('SELECT * FROM audit_log ORDER BY created_at DESC');

    const BOM = '\uFEFF';
    const header = 'id,action,detail,created_at';
    const rows = (logs as any[]).map(l => {
      const detail = (l.detail || '').replace(/"/g, '""');
      return `${l.id},"${l.action}","${detail}","${l.created_at}"`;
    });

    const csv = BOM + header + '\n' + rows.join('\n');
    const today = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="tainan_logs_${today}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting logs:', error);
    res.status(500).json({ error: 'Failed to export logs' });
  }
});

// POST /api/logs/import — Import logs from CSV
router.post('/import', async (req: Request, res: Response): Promise<void> => {
  try {
    const { csv } = req.body;
    if (!csv || typeof csv !== 'string') { res.status(400).json({ error: 'Missing csv field' }); return; }

    const raw = csv.replace(/^\uFEFF/, '');
    const lines = raw.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) { res.status(400).json({ error: 'CSV must have header + at least 1 data row' }); return; }

    const header = lines[0].toLowerCase().split(',').map(h => h.trim());
    const actionIdx = header.indexOf('action');
    const detailIdx = header.indexOf('detail');
    const dateIdx = header.indexOf('created_at');
    if (actionIdx < 0) { res.status(400).json({ error: 'CSV must have an action column' }); return; }

    let imported = 0;
    for (let i = 1; i < lines.length; i++) {
      const fields = parseCSVLine(lines[i]);
      const action = fields[actionIdx]?.trim();
      if (!action) continue;
      const detail = detailIdx >= 0 ? fields[detailIdx]?.trim() || null : null;
      const createdAt = dateIdx >= 0 ? fields[dateIdx]?.trim() || null : null;

      if (createdAt) await dbRun('INSERT INTO audit_log (action, detail, created_at) VALUES (?, ?, ?)', action, detail, createdAt);
      else await dbRun('INSERT INTO audit_log (action, detail) VALUES (?, ?)', action, detail);
      imported++;
    }

    res.json({ message: `Imported ${imported} log entries`, imported });
  } catch (error) {
    console.error('Error importing logs:', error);
    res.status(500).json({ error: 'Failed to import logs' });
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

export default router;
