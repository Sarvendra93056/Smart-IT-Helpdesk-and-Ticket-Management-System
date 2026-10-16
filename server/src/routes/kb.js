import express from 'express';
import db from '../db/index.js';

const router = express.Router();

/**
 * Get knowledge base articles with optional search and category filter
 */
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let sql = `SELECT * FROM knowledge_base WHERE 1=1`;
    const params = [];

    if (category && category !== 'all') {
      sql += ` AND category = ?`;
      params.push(category);
    }

    if (search) {
      sql += ` AND (title LIKE ? OR summary LIKE ? OR keywords LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    sql += ` ORDER BY verified_solutions_count DESC, id ASC`;
    const articles = await db.query(sql, params);

    const parsed = articles.map(a => ({
      ...a,
      steps: a.steps ? JSON.parse(a.steps) : []
    }));

    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Add a new verified solution to the knowledge base
 */
router.post('/', async (req, res) => {
  try {
    const { title, category, keywords, summary, steps = [] } = req.body;
    if (!title || !category || !summary) {
      return res.status(400).json({ error: 'Title, category, and summary are required' });
    }

    await db.query(
      `INSERT INTO knowledge_base (title, category, keywords, summary, steps, verified_solutions_count)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [title, category, keywords || '', summary, JSON.stringify(steps)]
    );

    res.status(201).json({ message: 'Solution added to knowledge base' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
