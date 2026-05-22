const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getConversations, getMessages, sendMessage } = require('../controllers/chatController');
const { validateChatMessage, validateIdParam } = require('../middleware/validationMiddleware');

// Sve chat rute su zaštićene
router.get('/conversations', protect, getConversations);
router.get('/conversations/:id/messages', protect, validateIdParam('id'), getMessages);
router.post('/messages', protect, validateChatMessage, sendMessage);

module.exports = router;
