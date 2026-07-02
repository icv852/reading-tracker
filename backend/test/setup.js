// Load env vars before any app imports
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = require('../src/db');

/** Overrides pool.query to run queries inside a transaction. */
async function startTransaction() {
  const client = await pool.connect();
  await client.query('BEGIN');
  /* eslint-disable-next-line no-inner-require */
  const dbModule = require('../src/db');
  dbModule.query = (...args) => client.query(...args);
  dbModule._client = client;
}

/** Rolls back the transaction and restores the original pool.query. */
async function rollbackTransaction() {
  /* eslint-disable-next-line no-inner-require */
  const dbModule = require('../src/db');
  const client = dbModule._client;
  if (client) {
    await client.query('ROLLBACK');
    client.release();
  }
  delete dbModule._client;
  dbModule.query = pool.query.bind(pool);
}

module.exports = { startTransaction, rollbackTransaction };
