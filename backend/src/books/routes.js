const { Router } = require('express');
const { getBooks, createBook } = require('./controller');

const router = Router();
router.get('/', getBooks);
router.post('/', createBook);

module.exports = router;
