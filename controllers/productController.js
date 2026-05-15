const db = require('../config/db');

// @desc    Preuzmi sve proizvode iz baze
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    // JOIN sa tabelom kategorija. Ako join ne uspe (nema id-a), category_name će biti ono što je u p.category
    const sql = `
      SELECT p.*, IFNULL(c.name, p.category) as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category = c.id
      ORDER BY p.id DESC
    `;
    const [rows] = await db.query(sql);

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('❌ Greška pri čitanju iz baze:', error.message);
    res.status(500).json({
      success: false,
      message: "Greška na serveru prilikom preuzimanja proizvoda.",
      error: error.message
    });
  }
};

// @desc    Preuzmi proizvode specifičnog korisnika
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
      ORDER BY p.id DESC
    `;
    const [rows] = await db.query(sql, [userId]);
    
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('❌ Greška pri preuzimanju korisničkih proizvoda:', error.message);
    res.status(500).json({
      success: false,
      message: "Greška na serveru.",
      error: error.message
    });
  }
};

// @desc    Kreiraj novi proizvod
// @route   POST /api/products
// @access  Private (Ulogovani korisnici)
exports.createProduct = async (req, res) => {
  const { name, price, category, image, description, isOrganic, user_id } = req.body;

  try {
    const [result] = await db.query(
      'INSERT INTO products (name, price, category, image, description, isOrganic, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, price, category, image, description, isOrganic ? 1 : 0, user_id]
    );

    res.status(201).json({
      success: true,
      message: 'Proizvod uspešno dodat!',
      productId: result.insertId
    });
  } catch (error) {
    console.error('❌ Greška pri kreiranju proizvoda:', error.message);
    res.status(500).json({
      success: false,
      message: 'Greška na serveru pri čuvanju proizvoda.',
      error: error.message
    });
  }
};

// @desc    Ažuriraj proizvod
// @route   PUT /api/products/:id
// @access  Private
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, price, category, image, description, isOrganic } = req.body;

  try {
    await db.query(
      'UPDATE products SET name = ?, price = ?, category = ?, image = ?, description = ?, isOrganic = ? WHERE id = ?',
      [name, price, category, image, description, isOrganic ? 1 : 0, id]
    );

    res.status(200).json({ success: true, message: 'Proizvod uspešno ažuriran!' });
  } catch (error) {
    console.error('❌ Greška pri ažuriranju:', error.message);
    res.status(500).json({ success: false, message: 'Greška na serveru.' });
  }
};

// @desc    Obriši proizvod
// @route   DELETE /api/products/:id
// @access  Private
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM products WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Proizvod uspešno obrisan!' });
  } catch (error) {
    console.error('❌ Greška pri brisanju:', error.message);
    res.status(500).json({ success: false, message: 'Greška na serveru.' });
  }
};
