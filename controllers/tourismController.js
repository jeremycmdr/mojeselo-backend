const db = require('../config/db');

const getPagination = (query) => {
    const limit = Number.parseInt(query.limit, 10);
    const offset = Number.parseInt(query.offset, 10);

    return {
        limit: Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : null,
        offset: Number.isInteger(offset) && offset >= 0 ? offset : 0
    };
};

// @desc    Get all rural tourism items
exports.getTourism = async (req, res) => {
    try {
        const { limit, offset } = getPagination(req.query);
        const paginationSql = limit ? ` LIMIT ${limit} OFFSET ${offset}` : '';

        const [rows] = await db.execute(`
            SELECT rt.*, u.name as household_name, tc.name as category, l.name as location_name
            FROM rural_tourism rt
            JOIN users u ON rt.household_id = u.id
            LEFT JOIN tourism_categories tc ON rt.category_id = tc.id
            LEFT JOIN locations l ON rt.location_id = l.id
            ORDER BY rt.created_at DESC, rt.id DESC
            ${paginationSql}
        `);

        let total = rows.length;
        if (limit) {
            const [countRows] = await db.execute('SELECT COUNT(*) as total FROM rural_tourism');
            total = countRows[0].total;
        }

        res.status(200).json({
            success: true,
            count: rows.length,
            total,
            limit,
            offset,
            hasMore: limit ? offset + rows.length < total : false,
            data: rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Greska pri preuzimanju podataka.' });
    }
};

// @desc    Get tourism items by user
exports.getTourismByUser = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT rt.*, tc.name as category, l.name as location_name
            FROM rural_tourism rt
            LEFT JOIN tourism_categories tc ON rt.category_id = tc.id
            LEFT JOIN locations l ON rt.location_id = l.id
            WHERE rt.household_id = ?
            ORDER BY rt.created_at DESC, rt.id DESC
        `, [req.params.userId]);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Greska pri preuzimanju.' });
    }
};

// @desc    Create rural tourism item
exports.createTourism = async (req, res) => {
    const { title, description, image, price, location_id, category_id } = req.body;
    const householdId = req.user.id;

    try {
        const [result] = await db.execute(
            'INSERT INTO rural_tourism (title, description, image, price, location_id, household_id, category_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [title, description, image, price, location_id, householdId, category_id]
        );
        res.status(201).json({ success: true, message: 'Oglas za turizam uspjesno dodat.', id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Greska pri cuvanju.' });
    }
};

// @desc    Update tourism item
exports.updateTourism = async (req, res) => {
    const { title, description, image, price, location_id, category_id } = req.body;
    const householdId = req.user.id;
    try {
        const [existingItems] = await db.execute(
            'SELECT id FROM rural_tourism WHERE id = ? AND household_id = ?',
            [req.params.id, householdId]
        );

        if (existingItems.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Oglas nije pronadjen ili nemate dozvolu za izmjenu.'
            });
        }

        await db.execute(
            'UPDATE rural_tourism SET title = ?, description = ?, image = ?, price = ?, location_id = ?, category_id = ? WHERE id = ? AND household_id = ?',
            [title, description, image, price, location_id, category_id, req.params.id, householdId]
        );
        res.status(200).json({ success: true, message: 'Uspesno izmijenjeno.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Greska pri izmjeni.' });
    }
};

// @desc    Delete tourism item
// @route   DELETE /api/tourism/:id
// @access  Private
exports.deleteTourism = async (req, res) => {
    const householdId = req.user.id;
    try {
        const [existingItems] = await db.execute(
            'SELECT id FROM rural_tourism WHERE id = ? AND household_id = ?',
            [req.params.id, householdId]
        );

        if (existingItems.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Oglas nije pronadjen ili nemate dozvolu za brisanje.'
            });
        }

        await db.execute('DELETE FROM rural_tourism WHERE id = ? AND household_id = ?', [req.params.id, householdId]);
        res.status(200).json({ success: true, message: 'Obrisano.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Greska pri brisanju.' });
    }
};
