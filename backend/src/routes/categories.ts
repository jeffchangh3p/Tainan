import { Router, Request, Response } from 'express';
import db from '../db/database';
import { validate, createCategorySchema } from '../middleware/validation';

const router = Router();

// GET /api/categories — List all
router.get('/', (_req: Request, res: Response): void => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY type, name').all();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/categories — Create
router.post('/', validate(createCategorySchema), (req: Request, res: Response): void => {
  try {
    const { name, type, icon } = req.body;
    const result = db.prepare(
      'INSERT INTO categories (name, type, icon) VALUES (?, ?, ?)'
    ).run(name, type, icon || null);

    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(category);
  } catch (error: any) {
    if (error?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(409).json({ error: 'Category name already exists' });
      return;
    }
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// DELETE /api/categories/:id — Delete
router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM categories WHERE id = ?').run(Number(id));
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
