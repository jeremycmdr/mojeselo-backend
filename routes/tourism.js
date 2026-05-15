const express = require('express');
const router = express.Router();
const { getTourism, getTourismByUser, createTourism, updateTourism, deleteTourism } = require('../controllers/tourismController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getTourism);
router.get('/user/:userId', getTourismByUser);
router.post('/', protect, createTourism);
router.put('/:id', protect, updateTourism);
router.delete('/:id', protect, deleteTourism);

module.exports = router;
