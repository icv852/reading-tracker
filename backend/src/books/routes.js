const { Router } = require('express');
const { requireAuth } = require('../auth/middleware');
const { getBooks, createBook, getBook, updateBook, deleteBook } = require('./controller');

const router = Router();

// All book routes require authentication
router.use(requireAuth);

router.get('/', getBooks);
router.post('/', createBook);
router.get('/:id', getBook);
router.put('/:id', updateBook);
router.delete('/:id', deleteBook);

module.exports = router;
