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

module.exports = { getBooks };
