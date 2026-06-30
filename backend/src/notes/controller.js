const pool = require('../db');

async function getNotes(req, res) {
  const bookId = Number(req.params.bookId);

  if (!Number.isInteger(bookId) || bookId < 1) {
    return res.status(400).json({ error: 'bookId must be a positive integer' });
  }

  try {
    // Verify book exists and belongs to user
    const bookResult = await pool.query(
      'SELECT id FROM books WHERE id = $1 AND user_id = $2',
      [bookId, req.user.id]
    );
    if (bookResult.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const result = await pool.query(
      'SELECT * FROM notes WHERE book_id = $1 ORDER BY created_at DESC',
      [bookId]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function createNote(req, res) {
  const bookId = Number(req.params.bookId);
  const { content, page } = req.body;

  if (!Number.isInteger(bookId) || bookId < 1) {
    return res.status(400).json({ error: 'bookId must be a positive integer' });
  }

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: 'content is required' });
  }

  if (page !== undefined && page !== null) {
    const pageNum = Number(page);
    if (!Number.isInteger(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: 'page must be a positive integer' });
    }
  }

  try {
    // Verify book exists and belongs to user
    const bookResult = await pool.query(
      'SELECT id FROM books WHERE id = $1 AND user_id = $2',
      [bookId, req.user.id]
    );
    if (bookResult.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const result = await pool.query(
      `INSERT INTO notes (book_id, content, page)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [bookId, content.trim(), page || null]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ error: 'book_id does not reference an existing book' });
    }
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getNote(req, res) {
  const bookId = Number(req.params.bookId);
  const noteId = Number(req.params.id);

  if (!Number.isInteger(bookId) || bookId < 1) {
    return res.status(400).json({ error: 'bookId must be a positive integer' });
  }
  if (!Number.isInteger(noteId) || noteId < 1) {
    return res.status(400).json({ error: 'id must be a positive integer' });
  }

  try {
    const result = await pool.query(
      `SELECT notes.* FROM notes
       JOIN books ON books.id = notes.book_id
       WHERE notes.id = $1 AND books.id = $2 AND books.user_id = $3`,
      [noteId, bookId, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateNote(req, res) {
  const bookId = Number(req.params.bookId);
  const noteId = Number(req.params.id);

  if (!Number.isInteger(bookId) || bookId < 1) {
    return res.status(400).json({ error: 'bookId must be a positive integer' });
  }
  if (!Number.isInteger(noteId) || noteId < 1) {
    return res.status(400).json({ error: 'id must be a positive integer' });
  }

  const { content, page } = req.body;

  // Validate fields if provided
  if (content !== undefined && content !== null) {
    if (typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'content must be a non-empty string' });
    }
  }

  if (page !== undefined && page !== null) {
    const pageNum = Number(page);
    if (!Number.isInteger(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: 'page must be a positive integer' });
    }
  }

  // At least one field must be provided
  if (content === undefined && page === undefined) {
    return res.status(400).json({ error: 'At least one field (content, page) must be provided' });
  }

  // Build dynamic UPDATE query
  const setClauses = [];
  const params = [];
  let paramIndex = 1;

  if (content !== undefined) {
    setClauses.push(`content = $${paramIndex++}`);
    params.push(content.trim());
  }
  if (page !== undefined) {
    setClauses.push(`page = $${paramIndex++}`);
    params.push(page);
  }

  params.push(noteId);
  params.push(bookId);
  params.push(req.user.id);

  const query = `UPDATE notes SET ${setClauses.join(', ')}
    FROM books
    WHERE notes.id = $${paramIndex}
      AND notes.book_id = books.id
      AND books.id = $${paramIndex + 1}
      AND books.user_id = $${paramIndex + 2}
    RETURNING notes.*`;

  paramIndex += 3;

  try {
    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteNote(req, res) {
  const bookId = Number(req.params.bookId);
  const noteId = Number(req.params.id);

  if (!Number.isInteger(bookId) || bookId < 1) {
    return res.status(400).json({ error: 'bookId must be a positive integer' });
  }
  if (!Number.isInteger(noteId) || noteId < 1) {
    return res.status(400).json({ error: 'id must be a positive integer' });
  }

  try {
    const result = await pool.query(
      `DELETE FROM notes
       USING books
       WHERE notes.id = $1
         AND notes.book_id = books.id
         AND books.id = $2
         AND books.user_id = $3
       RETURNING notes.*`,
      [noteId, bookId, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    return res.json({ message: 'Note deleted', note: result.rows[0] });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getNotes, createNote, getNote, updateNote, deleteNote };
