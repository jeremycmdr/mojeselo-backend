const db = require('../config/db');

// @desc    Preuzmi sva domaćinstva
// @route   GET /api/households
// @access  Public
exports.getHouseholds = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM households ORDER BY created_at DESC');
    
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('❌ Greška pri preuzimanju domaćinstava:', error.message);
    res.status(500).json({ success: false, message: 'Greška na serveru.' });
  }
};

// @desc    Preuzmi jedno domaćinstvo po ID-u
// @route   GET /api/households/:id
// @access  Public
exports.getHouseholdById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM households WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Domaćinstvo nije pronađeno.' });
    }

    res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('❌ Greška pri preuzimanju domaćinstva:', error.message);
    res.status(500).json({ success: false, message: 'Greška na serveru.' });
  }
};
