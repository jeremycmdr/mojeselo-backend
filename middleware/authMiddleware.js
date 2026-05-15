const jwt = require('jsonwebtoken');
const db = require('../config/db');

const protect = async (req, res, next) => {
  let token;

  // Proveravamo da li token postoji u Authorization headeru
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Uzimamo token (izbacujemo 'Bearer ' deo)
      token = req.headers.authorization.split(' ')[1];

      // Verifikacija tokena
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Provera da li korisnik i dalje postoji u bazi i koji mu je status
      const [users] = await db.query('SELECT id, name, email, status FROM users WHERE id = ?', [decoded.id]);

      if (users.length === 0) {
        return res.status(401).json({ success: false, message: 'Korisnik više ne postoji.' });
      }

      const user = users[0];

      // Provera da li je korisnik banovan
      if (user.status === 0) {
        return res.status(403).json({ success: false, message: 'Vaš nalog je suspendovan. Kontaktirajte podršku.' });
      }

      // Ako je sve u redu, dodajemo podatke korisnika u request objekat
      req.user = user;
      next();
    } catch (error) {
      console.error('❌ Token Error:', error.message);
      res.status(401).json({ success: false, message: 'Niste autorizovani, token je neispravan.' });
    }
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Niste autorizovani, nema tokena.' });
  }
};

module.exports = { protect };
