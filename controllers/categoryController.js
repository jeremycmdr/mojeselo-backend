const db = require('../config/db');

// @desc    Preuzmi sve kategorije
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categories ORDER BY name ASC');
    
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('❌ Greška pri preuzimanju kategorija:', error.message);
    res.status(500).json({ success: false, message: 'Greška na serveru.' });
  }
};
