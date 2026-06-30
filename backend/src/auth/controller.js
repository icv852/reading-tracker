const bcrypt = require('bcrypt');
const pool = require('../db');

async function registerUser(req, res) {
  const { email, password } = req.body;

  // Validate email
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email is required' });
  }

  // Validate password
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, created_at`,
      [email.trim().toLowerCase(), password_hash]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    // Unique violation on email
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { registerUser };
