const db = require('../config/db');

const getPagination = (query) => {
  const limit = Number.parseInt(query.limit, 10);
  const offset = Number.parseInt(query.offset, 10);

  return {
    limit: Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : null,
    offset: Number.isInteger(offset) && offset >= 0 ? offset : 0
  };
};

// @desc    Preuzmi sve proizvode iz baze
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const { limit, offset } = getPagination(req.query);
    const paginationSql = limit ? ` LIMIT ${limit} OFFSET ${offset}` : '';

    const sql = `
      SELECT p.*, IFNULL(c.name, p.category) as category_name
      FROM products p
      LEFT JOIN categories c ON p.category = c.id
      ORDER BY p.created_at DESC, p.id DESC
      ${paginationSql}
    `;
    const [rows] = await db.query(sql);

    let total = rows.length;
    if (limit) {
      const [countRows] = await db.query('SELECT COUNT(*) as total FROM products');
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
    console.error('Greska pri citanju iz baze:', error.message);
    res.status(500).json({
      success: false,
      message: 'Greska na serveru prilikom preuzimanja proizvoda.',
      error: error.message
    });
  }
};

// @desc    Preuzmi proizvode specificnog korisnika
// @route   GET /api/products/user/:userId
// @access  Public
exports.getProductsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const sql = `
      SELECT p.*, IFNULL(c.name, p.category) as category_name
      FROM products p
      LEFT JOIN categories c ON p.category = c.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC, p.id DESC
    `;
    const [rows] = await db.query(sql, [userId]);

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Greska pri preuzimanju korisnickih proizvoda:', error.message);
    res.status(500).json({
      success: false,
      message: 'Greska na serveru.',
      error: error.message
    });
  }
};

// @desc    Kreiraj novi proizvod
// @route   POST /api/products
// @access  Private (Ulogovani korisnici)
exports.createProduct = async (req, res) => {
  const { name, price, category, image, description, isOrganic } = req.body;
  const userId = req.user.id;

  try {
    const [result] = await db.query(
      'INSERT INTO products (name, price, category, image, description, isOrganic, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, price, category, image, description, isOrganic ? 1 : 0, userId]
    );

    res.status(201).json({
      success: true,
      message: 'Proizvod uspesno dodat!',
      productId: result.insertId
    });
  } catch (error) {
    console.error('Greska pri kreiranju proizvoda:', error.message);
    res.status(500).json({
      success: false,
      message: 'Greska na serveru pri cuvanju proizvoda.',
      error: error.message
    });
  }
};

// @desc    Azuriraj proizvod
// @route   PUT /api/products/:id
// @access  Private
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, price, category, image, description, isOrganic } = req.body;
  const userId = req.user.id;

  try {
    const [existingProducts] = await db.query(
      'SELECT id FROM products WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (existingProducts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Proizvod nije pronadjen ili nemate dozvolu za izmjenu.'
      });
    }

    await db.query(
      'UPDATE products SET name = ?, price = ?, category = ?, image = ?, description = ?, isOrganic = ? WHERE id = ? AND user_id = ?',
      [name, price, category, image, description, isOrganic ? 1 : 0, id, userId]
    );

    res.status(200).json({ success: true, message: 'Proizvod uspesno azuriran!' });
  } catch (error) {
    console.error('Greska pri azuriranju:', error.message);
    res.status(500).json({ success: false, message: 'Greska na serveru.' });
  }
};

// @desc    Obrisi proizvod
// @route   DELETE /api/products/:id
// @access  Private
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const [existingProducts] = await db.query(
      'SELECT id FROM products WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (existingProducts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Proizvod nije pronadjen ili nemate dozvolu za brisanje.'
      });
    }

    await db.query('DELETE FROM products WHERE id = ? AND user_id = ?', [id, userId]);
    res.status(200).json({ success: true, message: 'Proizvod uspesno obrisan!' });
  } catch (error) {
    console.error('Greska pri brisanju:', error.message);
    res.status(500).json({ success: false, message: 'Greska na serveru.' });
  }
};
