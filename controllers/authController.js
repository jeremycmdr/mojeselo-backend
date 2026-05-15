const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Registracija novog korisnika
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  const { name, email, password, town } = req.body;

  try {
    // 1. Provera da li korisnik već postoji
    const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: 'Korisnik sa ovim email-om već postoji.' });
    }

    // 2. Šifrovanje lozinke
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Upis u bazu (uključujući town)
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, town) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, town]
    );

    const userId = result.insertId;

    // 4. Kreiranje inicijalnog domaćinstva za korisnika
    await db.query(
      'INSERT INTO households (user_id, name, town) VALUES (?, ?, ?)',
      [userId, name, town]
    );

    // 5. Kreiranje JWT tokena
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    res.status(201).json({
      success: true,
      message: 'Uspešna registracija!',
      token,
      user: {
        id: result.insertId,
        name,
        email,
        town
      }
    });
  } catch (error) {
    console.error('❌ Greška pri registraciji:', error.message);
    res.status(500).json({ success: false, message: 'Greška na serveru.' });
  }
};

// @desc    Prijava korisnika (Login)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Provera da li korisnik postoji
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Neispravni podaci za prijavu.' });
    }

    const user = users[0];

    // 2. Provera da li je nalog suspendovan
    if (user.status === 0) {
      return res.status(403).json({ success: false, message: 'Vaš nalog je suspendovan. Kontaktirajte podršku.' });
    }

    // 3. Provera lozinke
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Neispravni podaci za prijavu.' });
    }

    // 3. Kreiranje JWT tokena
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    res.status(200).json({
      success: true,
      message: 'Uspešna prijava!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        town: user.town
      }
    });
  } catch (error) {
    console.error('❌ Greška pri prijavi:', error.message);
    res.status(500).json({ success: false, message: 'Greška na serveru.' });
  }
};
