require('dotenv').config();
const express = require('express');
const cors = require('cors');

const menuRoutes = require('./routes/menu');
const ordersRoutes = require('./routes/orders');
const inventoryRoutes = require('./routes/inventory');
const employeesRoutes = require('./routes/employees');
const authRoutes = require('./routes/auth');
const translateRoutes = require('./routes/translate');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/menu', menuRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/translate', translateRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', shop: 'Fade Boba' });
});

app.listen(PORT, () => {
  console.log(`Fade Boba backend running on http://localhost:${PORT}`);
});