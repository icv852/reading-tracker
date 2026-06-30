const crypto = require('crypto');
const pool = require('../db');

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const rawToken = authHeader.slice(7);
  if (!rawToken) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const result = await pool.query(
      `SELECT s.user_id, u.email
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Attach user and token hash to request so downstream handlers can use them
    req.user = {
      id: result.rows[0].user_id,
      email: result.rows[0].email,
    };
    req.tokenHash = tokenHash;

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { requireAuth };
