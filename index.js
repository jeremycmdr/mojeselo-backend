const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: "Dobrodošli na MojeSelo Backend API!",
    status: "online",
    documentation: "/api/products, /api/households"
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/households', require('./routes/households'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/tourism-categories', require('./routes/tourismCategories'));
app.use('/api/tourism', require('./routes/tourism'));

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server je spreman!`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🕒 Startovano: ${new Date().toLocaleTimeString()}\n`);
});
