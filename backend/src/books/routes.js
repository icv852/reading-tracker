const { Router } = require('express');
const { getBooks } = require('./controller');

const router = Router();
router.get('/', getBooks);

module.exports = router;
