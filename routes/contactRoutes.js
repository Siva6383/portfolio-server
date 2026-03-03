const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { sendContactMessage } = require('../controllers/contactController');

// Protected — must be logged in
router.post('/send', protect, sendContactMessage);

module.exports = router;