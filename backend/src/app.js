const express = require('express');
const booksRouter = require('./books/routes');
const authRouter = require('./auth/routes');

const app = express();
app.use(express.json());
app.use('/books', booksRouter);
app.use('/auth', authRouter);

module.exports = app;
