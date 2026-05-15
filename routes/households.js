const express = require('express');
const router = express.Router();
const { getHouseholds, getHouseholdById } = require('../controllers/householdController');

// Ruta za sva domaćinstva
router.get('/', getHouseholds);

// Ruta za jedno domaćinstvo
router.get('/:id', getHouseholdById);

module.exports = router;
