const db = require('../config/db');

// @desc    Preuzmi sve lokacije (grupisane za CustomSelect)
// @route   GET /api/locations
// @access  Public
exports.getLocations = async (req, res) => {
  try {
    // 1. Preuzmi sve lokacije
    const [rows] = await db.query('SELECT * FROM locations ORDER BY parent_id ASC, name ASC');
    
    // 2. Razdvoj roditelje i decu
    const parents = rows.filter(row => row.parent_id === null);
    const children = rows.filter(row => row.parent_id !== null);

    // 3. Formiraj strukturu koju CustomSelect očekuje
    const groupedLocations = parents.map(parent => {
      const parentOptions = children
        .filter(child => child.parent_id === parent.id)
        .map(child => ({
          value: child.id,
          label: child.name
        }));
      
      // Ako roditelj nema dece, on sam je opcija (npr. Brčko Distrikt)
      if (parentOptions.length === 0) {
        return { value: parent.id, label: parent.name };
      }

      return {
        label: parent.name,
        options: parentOptions
      };
    });

    res.status(200).json({
      success: true,
      data: groupedLocations
    });
  } catch (error) {
    console.error('❌ Greška pri preuzimanju lokacija:', error.message);
    res.status(500).json({ success: false, message: 'Greška na serveru.' });
  }
};
