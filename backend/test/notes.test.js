const { startTransaction, rollbackTransaction } = require('./setup');
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { createTestUser, createTestBook, createTestNote } = require('./helpers');

describe('Notes endpoints', () => {
  let token;
  let otherToken;
  let book;

  beforeEach(async () => {
    await startTransaction();
    const user = await createTestUser();
    token = user.token;
    const otherUser = await createTestUser();
    otherToken = otherUser.token;
    book = await createTestBook(token);
  });

  afterEach(rollbackTransaction);

  describe('GET /books/:bookId/notes', () => {
    it('should return empty array when book has no notes', async () => {
      const res = await request(app)
        .get(`/books/${book.id}/notes`)
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.deepStrictEqual(res.body, []);
    });

    it('should return created notes', async () => {
      await createTestNote(token, book.id);

      const res = await request(app)
        .get(`/books/${book.id}/notes`)
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.length, 1);
      assert.strictEqual(res.body[0].content, 'Test note content');
    });

    it('should return 404 for nonexistent book', async () => {
      const res = await request(app)
        .get('/books/999999/notes')
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 404);
    });
  });

  describe('POST /books/:bookId/notes', () => {
    it('should create a note and return 201', async () => {
      const res = await request(app)
        .post(`/books/${book.id}/notes`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Great book!', page: 42 });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.content, 'Great book!');
      assert.strictEqual(res.body.page, 42);
      assert.strictEqual(res.body.book_id, book.id);
    });

    it('should return 400 when content is missing', async () => {
      const res = await request(app)
        .post(`/books/${book.id}/notes`)
        .set('Authorization', `Bearer ${token}`)
        .send({ page: 10 });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error, 'content is required');
    });

    it('should return 400 for invalid page', async () => {
      const res = await request(app)
        .post(`/books/${book.id}/notes`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Note', page: 0 });

      assert.strictEqual(res.status, 400);
    });

    it('should return 404 for nonexistent book', async () => {
      const res = await request(app)
        .post('/books/999999/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Orphan note' });

      assert.strictEqual(res.status, 404);
    });
  });

  describe('GET /books/:bookId/notes/:id', () => {
    it('should return a note by id', async () => {
      const note = await createTestNote(token, book.id);

      const res = await request(app)
        .get(`/books/${book.id}/notes/${note.id}`)
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.content, note.content);
    });

    it('should return 404 for nonexistent note', async () => {
      const res = await request(app)
        .get(`/books/${book.id}/notes/999999`)
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 404);
    });

    it('should return 404 for another user note', async () => {
      const note = await createTestNote(token, book.id);

      const res = await request(app)
        .get(`/books/${book.id}/notes/${note.id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      assert.strictEqual(res.status, 404);
    });
  });

  describe('PUT /books/:bookId/notes/:id', () => {
    it('should update note content', async () => {
      const note = await createTestNote(token, book.id);

      const res = await request(app)
        .put(`/books/${book.id}/notes/${note.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Updated content' });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.content, 'Updated content');
    });

    it('should update note page', async () => {
      const note = await createTestNote(token, book.id, { page: 5 });

      const res = await request(app)
        .put(`/books/${book.id}/notes/${note.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ page: 10 });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.page, 10);
    });

    it('should return 400 when no fields provided', async () => {
      const note = await createTestNote(token, book.id);

      const res = await request(app)
        .put(`/books/${book.id}/notes/${note.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      assert.strictEqual(res.status, 400);
    });
  });

  describe('DELETE /books/:bookId/notes/:id', () => {
    it('should delete own note', async () => {
      const note = await createTestNote(token, book.id);

      const res = await request(app)
        .delete(`/books/${book.id}/notes/${note.id}`)
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.message, 'Note deleted');

      // Verify it's gone
      const getRes = await request(app)
        .get(`/books/${book.id}/notes/${note.id}`)
        .set('Authorization', `Bearer ${token}`);
      assert.strictEqual(getRes.status, 404);
    });

    it('should return 404 for nonexistent note', async () => {
      const res = await request(app)
        .delete(`/books/${book.id}/notes/999999`)
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 404);
    });
  });
});
