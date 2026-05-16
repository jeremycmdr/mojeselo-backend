const express = require('express');
const router = express.Router();
const { getTourismCategories } = require('../controllers/tourismCategoryController');

router.get('/', getTourismCategories);

module.exports = router;
