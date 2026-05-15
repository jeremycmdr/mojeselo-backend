const db = require('../config/db');

// @desc    Get all rural tourism items
// @route   GET /api/tourism
// @access  Public
exports.getTourism = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT rt.*, u.name as household_name 
            FROM rural_tourism rt
            JOIN users u ON rt.household_id = u.id
            ORDER BY rt.created_at DESC
        `);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Greška pri preuzimanju podataka.' });
    }
};

// @desc    Get tourism items by user
// @route   GET /api/tourism/user/:userId
// @access  Public
exports.getTourismByUser = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM rural_tourism WHERE household_id = ?', [req.params.userId]);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Greška pri preuzimanju.' });
    }
};

// @desc    Create rural tourism item
// @route   POST /api/tourism
// @access  Private
exports.createTourism = async (req, res) => {
    const { title, description, image, price, location, household_id } = req.body;

    try {
        const [result] = await db.execute(
            'INSERT INTO rural_tourism (title, description, image, price, location, household_id) VALUES (?, ?, ?, ?, ?, ?)',
            [title, description, image, price, location, household_id]
        );
        res.status(201).json({ success: true, message: 'Oglas za turizam uspješno dodat.', id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Greška pri čuvanju.' });
    }
};

// @desc    Update tourism item
// @route   PUT /api/tourism/:id
// @access  Private
exports.updateTourism = async (req, res) => {
    const { title, description, image, price, location } = req.body;
    try {
        await db.execute(
            'UPDATE rural_tourism SET title = ?, description = ?, image = ?, price = ?, location = ? WHERE id = ?',
            [title, description, image, price, location, req.params.id]
        );
        res.status(200).json({ success: true, message: 'Uspešno izmijenjeno.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Greška pri izmjeni.' });
    }
};

// @desc    Delete tourism item
// @route   DELETE /api/tourism/:id
// @access  Private
exports.deleteTourism = async (req, res) => {
    try {
        await db.execute('DELETE FROM rural_tourism WHERE id = ?', [req.params.id]);
        res.status(200).json({ success: true, message: 'Obrisano.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Greška pri brisanju.' });
    }
};
