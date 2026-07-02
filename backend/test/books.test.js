const { startTransaction, rollbackTransaction } = require('./setup');
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { createTestUser, createTestBook } = require('./helpers');

describe('Books endpoints', () => {
  let token;
  let secondUserToken;

  beforeEach(async () => {
    await startTransaction();
    const user = await createTestUser();
    token = user.token;
    const user2 = await createTestUser();
    secondUserToken = user2.token;
  });

  afterEach(rollbackTransaction);

  describe('GET /books', () => {
    it('should return an empty array for a new user', async () => {
      const res = await request(app)
        .get('/books')
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.deepStrictEqual(res.body, []);
    });

    it('should return created books', async () => {
      await createTestBook(token);

      const res = await request(app)
        .get('/books')
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.length, 1);
      assert.strictEqual(res.body[0].title, 'Test Book');
    });

    it('should filter books by status', async () => {
      await createTestBook(token, { status: 'reading' });
      await createTestBook(token, { title: 'Finished Book', status: 'finished' });

      const res = await request(app)
        .get('/books?status=reading')
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.length, 1);
      assert.strictEqual(res.body[0].status, 'reading');
    });

    it('should filter books by rating', async () => {
      await createTestBook(token, { rating: 5 });
      await createTestBook(token, { title: 'Mediocre Book', rating: 3 });

      const res = await request(app)
        .get('/books?rating=5')
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.length, 1);
      assert.strictEqual(res.body[0].rating, 5);
    });

    it('should return 400 for invalid status filter', async () => {
      const res = await request(app)
        .get('/books?status=invalid_status')
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 400);
    });

    it('should not return other users books', async () => {
      await createTestBook(token);

      const res = await request(app)
        .get('/books')
        .set('Authorization', `Bearer ${secondUserToken}`);

      assert.strictEqual(res.status, 200);
      assert.deepStrictEqual(res.body, []);
    });
  });

  describe('POST /books', () => {
    it('should create a book and return 201', async () => {
      const res = await request(app)
        .post('/books')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'New Book', author: 'New Author' });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.title, 'New Book');
      assert.strictEqual(res.body.author, 'New Author');
      assert.strictEqual(res.body.status, 'want_to_read');
    });

    it('should return 400 when title is missing', async () => {
      const res = await request(app)
        .post('/books')
        .set('Authorization', `Bearer ${token}`)
        .send({ author: 'No Title' });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error, 'title is required');
    });

    it('should return 400 for invalid status', async () => {
      const res = await request(app)
        .post('/books')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Bad Book', status: 'nonexistent' });

      assert.strictEqual(res.status, 400);
    });

    it('should return 400 for invalid rating', async () => {
      const res = await request(app)
        .post('/books')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Bad Book', rating: 10 });

      assert.strictEqual(res.status, 400);
    });
  });

  describe('GET /books/:id', () => {
    it('should return a book by id', async () => {
      const book = await createTestBook(token);

      const res = await request(app)
        .get(`/books/${book.id}`)
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.title, book.title);
    });

    it('should return 404 for nonexistent book', async () => {
      const res = await request(app)
        .get('/books/999999')
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 404);
    });

    it('should return 404 for another user book', async () => {
      const book = await createTestBook(token);

      const res = await request(app)
        .get(`/books/${book.id}`)
        .set('Authorization', `Bearer ${secondUserToken}`);

      assert.strictEqual(res.status, 404);
    });

    it('should return 400 for non-integer id', async () => {
      const res = await request(app)
        .get('/books/abc')
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 400);
    });
  });

  describe('PUT /books/:id', () => {
    it('should update a book title', async () => {
      const book = await createTestBook(token);

      const res = await request(app)
        .put(`/books/${book.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Title' });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.title, 'Updated Title');
    });

    it('should update partial fields', async () => {
      const book = await createTestBook(token);

      const res = await request(app)
        .put(`/books/${book.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'finished', rating: 4 });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, 'finished');
      assert.strictEqual(res.body.rating, 4);
    });

    it('should return 400 when no fields provided', async () => {
      const book = await createTestBook(token);

      const res = await request(app)
        .put(`/books/${book.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      assert.strictEqual(res.status, 400);
    });

    it('should return 404 for nonexistent book', async () => {
      const res = await request(app)
        .put('/books/999999')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Ghost' });

      assert.strictEqual(res.status, 404);
    });
  });

  describe('DELETE /books/:id', () => {
    it('should delete own book', async () => {
      const book = await createTestBook(token);

      const res = await request(app)
        .delete(`/books/${book.id}`)
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.message, 'Book deleted');

      // Verify it's gone
      const getRes = await request(app)
        .get(`/books/${book.id}`)
        .set('Authorization', `Bearer ${token}`);
      assert.strictEqual(getRes.status, 404);
    });

    it('should return 404 for nonexistent book', async () => {
      const res = await request(app)
        .delete('/books/999999')
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 404);
    });

    it('should return 404 when deleting another user book', async () => {
      const book = await createTestBook(token);

      const res = await request(app)
        .delete(`/books/${book.id}`)
        .set('Authorization', `Bearer ${secondUserToken}`);

      assert.strictEqual(res.status, 404);
    });
  });
});
