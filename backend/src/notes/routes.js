const { Router } = require('express');
const { requireAuth } = require('../auth/middleware');
const { getNotes, createNote, getNote, updateNote, deleteNote } = require('./controller');

const router = Router();

// All note routes require authentication
router.use(requireAuth);

router.get('/:bookId/notes', getNotes);
router.post('/:bookId/notes', createNote);
router.get('/:bookId/notes/:id', getNote);
router.put('/:bookId/notes/:id', updateNote);
router.delete('/:bookId/notes/:id', deleteNote);

module.exports = router;
