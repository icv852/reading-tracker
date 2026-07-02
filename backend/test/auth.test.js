const { startTransaction, rollbackTransaction } = require('./setup');
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');

describe('Auth endpoints', () => {
  beforeEach(startTransaction);
  afterEach(rollbackTransaction);

  describe('POST /auth/register', () => {
    it('should register a new user and return 201', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'alice@test.com', password: 'secret123' });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.email, 'alice@test.com');
      assert.ok(res.body.id);
      assert.ok(res.body.created_at);
      // password_hash must never be exposed
      assert.strictEqual(res.body.password_hash, undefined);
    });

    it('should return 400 when email is missing', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ password: 'secret123' });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error, 'A valid email is required');
    });

    it('should return 400 when email lacks @', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'notanemail', password: 'secret123' });

      assert.strictEqual(res.status, 400);
    });

    it('should return 400 when password is too short', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'bob@test.com', password: '12345' });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error, 'Password must be at least 6 characters');
    });

    it('should return 409 when email is already taken', async () => {
      await request(app)
        .post('/auth/register')
        .send({ email: 'dup@test.com', password: 'secret123' });

      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'dup@test.com', password: 'other456' });

      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.body.error, 'A user with this email already exists');
    });

    it('should normalize email to lowercase', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'UPPERCASE@TEST.COM', password: 'secret123' });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.email, 'uppercase@test.com');
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/auth/register')
        .send({ email: 'login@test.com', password: 'secret123' });
    });

    it('should login and return 200 with a token', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'login@test.com', password: 'secret123' });

      assert.strictEqual(res.status, 200);
      assert.ok(res.body.token);
      assert.strictEqual(res.body.user.email, 'login@test.com');
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'login@test.com', password: 'wrongpass' });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error, 'Invalid email or password');
    });

    it('should return 401 for nonexistent email', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'nobody@test.com', password: 'secret123' });

      assert.strictEqual(res.status, 401);
      // Generic message to avoid email enumeration
      assert.strictEqual(res.body.error, 'Invalid email or password');
    });
  });

  describe('POST /auth/logout', () => {
    it('should log out and return 200', async () => {
      const regRes = await request(app)
        .post('/auth/register')
        .send({ email: 'logout@test.com', password: 'secret123' });

      const loginRes = await request(app)
        .post('/auth/login')
        .send({ email: 'logout@test.com', password: 'secret123' });

      const res = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${loginRes.body.token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.message, 'Logged out successfully');
    });
  });

  describe('Auth middleware (requireAuth)', () => {
    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/books');

      assert.strictEqual(res.status, 401);
    });

    it('should return 401 when an invalid token is provided', async () => {
      const res = await request(app)
        .get('/books')
        .set('Authorization', 'Bearer this-is-garbage');

      assert.strictEqual(res.status, 401);
    });
  });
});
