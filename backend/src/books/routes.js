const { Router } = require('express');
const { getBooks, createBook, getBook, updateBook, deleteBook } = require('./controller');

const router = Router();
router.get('/', getBooks);
router.post('/', createBook);
router.get('/:id', getBook);
router.put('/:id', updateBook);
router.delete('/:id', deleteBook);

module.exports = router;
