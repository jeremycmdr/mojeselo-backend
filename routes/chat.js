const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getConversations, getMessages, sendMessage } = require('../controllers/chatController');

// Sve chat rute su zaštićene
router.get('/conversations', protect, getConversations);
router.get('/conversations/:id/messages', protect, getMessages);
router.post('/messages', protect, sendMessage);

module.exports = router;
