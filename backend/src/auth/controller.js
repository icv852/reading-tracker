const bcrypt = require('bcrypt');
const crypto = require('crypto');
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

async function loginUser(req, res) {
  const { email, password } = req.body;

  // Validate presence
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Look up user by email
    const userResult = await pool.query(
      'SELECT id, email, password_hash, created_at FROM users WHERE email = $1',
      [email.trim().toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = userResult.rows[0];

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate session token (64-char hex)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Store hashed token in sessions table
    await pool.query(
      'INSERT INTO sessions (user_id, token_hash) VALUES ($1, $2)',
      [user.id, tokenHash]
    );

    // Return token + user info (never expose password_hash)
    return res.status(200).json({
      token: rawToken,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function logoutUser(req, res) {
  try {
    await pool.query('DELETE FROM sessions WHERE token_hash = $1', [req.tokenHash]);
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { registerUser, loginUser, logoutUser };
