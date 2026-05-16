const db = require('../config/db');

// @desc    Preuzmi sve kategorije seoskog turizma
// @route   GET /api/tourism-categories
// @access  Public
exports.getTourismCategories = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tourism_categories ORDER BY name ASC');
    
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('❌ Greška pri preuzimanju kategorija turizma:', error.message);
    res.status(500).json({ success: false, message: 'Greška na serveru.' });
  }
};
