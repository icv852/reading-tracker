const request = require('supertest');
const app = require('../src/app');

/** Register and log in a test user, returning { user, token }. */
async function createTestUser() {
  const email = `test-${Date.now()}@example.com`;
  const res = await request(app)
    .post('/auth/register')
    .send({ email, password: 'password123' });
  const user = res.body;

  const loginRes = await request(app)
    .post('/auth/login')
    .send({ email, password: 'password123' });
  return { user, token: loginRes.body.token };
}

/** Create a test book for the given auth token. Returns the book object. */
async function createTestBook(token, overrides = {}) {
  const res = await request(app)
    .post('/books')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'Test Book', author: 'Test Author', ...overrides });
  return res.body;
}

/** Create a test note under the given bookId. */
async function createTestNote(token, bookId, overrides = {}) {
  const res = await request(app)
    .post(`/books/${bookId}/notes`)
    .set('Authorization', `Bearer ${token}`)
    .send({ content: 'Test note content', ...overrides });
  return res.body;
}

module.exports = { createTestUser, createTestBook, createTestNote };
