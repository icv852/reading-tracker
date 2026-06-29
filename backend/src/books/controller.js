const pool = require('../db');

const VALID_STATUSES = ['want_to_read', 'reading', 'finished'];

async function getBooks(req, res) {
  const { user_id, title, author, status, rating } = req.query;

  // Validate status
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
    });
  }

  // Validate user_id is a positive integer if provided
  if (user_id && (!Number.isInteger(Number(user_id)) || Number(user_id) < 1)) {
    return res.status(400).json({ error: 'user_id must be a positive integer' });
  }

  // Validate rating is 1-5 if provided
  if (rating) {
    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'rating must be an integer between 1 and 5' });
    }
  }

  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (user_id) {
    conditions.push(`user_id = $${paramIndex++}`);
    params.push(user_id);
  }

  if (title) {
    conditions.push(`title ILIKE $${paramIndex++}`);
    params.push(`%${title}%`);
  }

  if (author) {
    conditions.push(`author ILIKE $${paramIndex++}`);
    params.push(`%${author}%`);
  }

  if (status) {
    conditions.push(`status = $${paramIndex++}`);
    params.push(status);
  }

  if (rating) {
    conditions.push(`rating = $${paramIndex++}`);
    params.push(rating);
  }

  let query = 'SELECT * FROM books';
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY created_at DESC';

  try {
    const result = await pool.query(query, params);
    return res.json(result.rows);
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function createBook(req, res) {
  const { user_id, title, author, status, rating } = req.body;

  // Validate required fields
  if (user_id === undefined || user_id === null) {
    return res.status(400).json({ error: 'user_id is required' });
  }
  if (!Number.isInteger(Number(user_id)) || Number(user_id) < 1) {
    return res.status(400).json({ error: 'user_id must be a positive integer' });
  }

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ error: 'title is required' });
  }

  // Validate optional fields
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
    });
  }

  if (rating !== undefined && rating !== null) {
    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'rating must be an integer between 1 and 5' });
    }
  }

  try {
    const result = await pool.query(
      `INSERT INTO books (user_id, title, author, status, rating)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, title.trim(), author || null, status || 'want_to_read', rating || null]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    // Foreign key violation (user_id doesn't exist)
    if (err.code === '23503') {
      return res.status(400).json({ error: 'user_id does not reference an existing user' });
    }
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getBooks, createBook };
