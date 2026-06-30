const { Router } = require('express');
const { requireAuth } = require('./middleware');
const { registerUser, loginUser, logoutUser } = require('./controller');

const router = Router();
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', requireAuth, logoutUser);

module.exports = router;
