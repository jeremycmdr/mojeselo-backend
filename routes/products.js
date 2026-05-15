const express = require('express');
const router = express.Router();
const { getProducts, getProductsByUser, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');

// Definisanje rute za preuzimanje svih proizvoda
router.get('/', getProducts);

// Ruta za proizvode specifičnog korisnika
router.get('/user/:userId', getProductsByUser);

// Ruta za dodavanje novog proizvoda (Zaštićena)
router.post('/', protect, createProduct);

// Ruta za izmenu proizvoda (Zaštićena)
router.put('/:id', protect, updateProduct);

// Ruta za brisanje proizvoda (Zaštićena)
router.delete('/:id', protect, deleteProduct);

module.exports = router;
