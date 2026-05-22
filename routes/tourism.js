const express = require('express');
const router = express.Router();
const { getTourism, getTourismByUser, createTourism, updateTourism, deleteTourism } = require('../controllers/tourismController');
const { protect } = require('../middleware/authMiddleware');
const { validateIdParam, validateTourism } = require('../middleware/validationMiddleware');

router.get('/', getTourism);
router.get('/user/:userId', getTourismByUser);
router.post('/', protect, validateTourism, createTourism);
router.put('/:id', protect, validateIdParam('id'), validateTourism, updateTourism);
router.delete('/:id', protect, validateIdParam('id'), deleteTourism);

module.exports = router;
