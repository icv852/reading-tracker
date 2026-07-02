const pool = require('../db');

const VALID_STATUSES = ['want_to_read', 'reading', 'finished'];

async function getBooks(req, res) {
  const { title, author, status, rating } = req.query;

  // Validate status
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
    });
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

  // Always scope to the authenticated user
  conditions.push(`user_id = $${paramIndex++}`);
  params.push(req.user.id);

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
  const { title, author, status, rating } = req.body;

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
      [req.user.id, title.trim(), author || null, status || 'want_to_read', rating || null]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getBook(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'id must be a positive integer' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM books WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found.' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateBook(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'id must be a positive integer' });
  }

  const { user_id, title, author, status, rating } = req.body;

  // Validate fields if provided
  if (user_id !== undefined && user_id !== null) {
    if (!Number.isInteger(Number(user_id)) || Number(user_id) < 1) {
      return res.status(400).json({ error: 'user_id must be a positive integer' });
    }
  }

  if (title !== undefined && title !== null) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'title must be a non-empty string' });
    }
  }

  if (status !== undefined && status !== null) {
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }
  }

  if (rating !== undefined && rating !== null) {
    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'rating must be an integer between 1 and 5' });
    }
  }

  // At least one field must be provided
  if (user_id === undefined && title === undefined && author === undefined && status === undefined && rating === undefined) {
    return res.status(400).json({ error: 'At least one field (user_id, title, author, status, rating) must be provided' });
  }

  // Build dynamic UPDATE query
  const setClauses = [];
  const params = [];
  let paramIndex = 1;

  if (user_id !== undefined) {
    setClauses.push(`user_id = $${paramIndex++}`);
    params.push(user_id);
  }
  if (title !== undefined) {
    setClauses.push(`title = $${paramIndex++}`);
    params.push(title.trim());
  }
  if (author !== undefined) {
    setClauses.push(`author = $${paramIndex++}`);
    params.push(author);
  }
  if (status !== undefined) {
    setClauses.push(`status = $${paramIndex++}`);
    params.push(status);
  }
  if (rating !== undefined) {
    setClauses.push(`rating = $${paramIndex++}`);
    params.push(rating);
  }

  params.push(id);
  params.push(req.user.id);
  const query = `UPDATE books SET ${setClauses.join(', ')} WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1} RETURNING *`;

  try {
    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ error: 'user_id does not reference an existing user' });
    }
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteBook(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'id must be a positive integer' });
  }

  try {
    const result = await pool.query('DELETE FROM books WHERE id = $1 AND user_id = $2 RETURNING *', [id, req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    return res.json({ message: 'Book deleted', book: result.rows[0] });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getBooks, createBook, getBook, updateBook, deleteBook };
