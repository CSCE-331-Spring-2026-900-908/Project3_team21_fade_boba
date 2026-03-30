// routes/menu.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all drinks
router.get('/drinks', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT menu_item_id, item_name, base_price FROM Menu_Items WHERE item_type = 'Drink' ORDER BY item_name"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch drinks' });
  }
});

// GET all addons
router.get('/addons', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT menu_item_id, item_name, base_price FROM Menu_Items WHERE item_type = 'Addon' ORDER BY item_name"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch addons' });
  }
});

// GET all menu items (drinks + addons)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT menu_item_id, item_name, base_price, item_type FROM Menu_Items ORDER BY item_type, item_name'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

// PUT update a menu item price (manager)
router.put('/:id/price', async (req, res) => {
  const { id } = req.params;
  const { base_price } = req.body;
  try {
    await pool.query(
      'UPDATE Menu_Items SET base_price = $1 WHERE menu_item_id = $2',
      [base_price, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update price' });
  }
});

module.exports = router;