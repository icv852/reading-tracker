const express = require('express');
const cors = require('cors');
const booksRouter = require('./books/routes');
const notesRouter = require('./notes/routes');
const authRouter = require('./auth/routes');

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use('/books', booksRouter);
app.use('/books', notesRouter);
app.use('/auth', authRouter);

module.exports = app;
