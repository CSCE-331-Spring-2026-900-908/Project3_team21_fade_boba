require('dotenv').config();
const express = require('express');   // get necessary packages/parameters
const cors = require('cors');

const menuRoutes = require('./routes/menu');
const ordersRoutes = require('./routes/orders');        // get the different database pieces
const inventoryRoutes = require('./routes/inventory');
const employeesRoutes = require('./routes/employees');
const authRoutes = require('./routes/auth');            // get the auth route

const app = express();                  // create an app with previous information, host on port 3001
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/menu', menuRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/auth', authRoutes);                       // use the auth route

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', shop: 'Fade Boba' });
});

app.listen(PORT, () => {
  console.log(`Fade Boba backend running on http://localhost:${PORT}`);   // log the server running the site in console
});