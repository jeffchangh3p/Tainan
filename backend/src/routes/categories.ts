import { Router, Request, Response } from 'express';
import { dbAll, dbGet, dbRun } from '../db/database';
import { validate, createCategorySchema } from '../middleware/validation';

const router = Router();

// GET /api/categories — List all
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await dbAll('SELECT * FROM categories ORDER BY type, name');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/categories — Create
router.post('/', validate(createCategorySchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, type, icon } = req.body;
    const result = await dbRun(
      'INSERT INTO categories (name, type, icon) VALUES (?, ?, ?)',
      name, type, icon || null
    );

    const category = await dbGet('SELECT * FROM categories WHERE id = ?', result.lastInsertRowid);
    res.status(201).json(category);
  } catch (error: any) {
    if (error?.message?.includes('UNIQUE')) {
      res.status(409).json({ error: 'Category name already exists' });
      return;
    }
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// DELETE /api/categories/:id — Delete
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await dbRun('DELETE FROM categories WHERE id = ?', Number(id));
    if (result.changes === 0) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.json({ message: 'Category deleted' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
