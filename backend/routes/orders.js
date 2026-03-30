// routes/orders.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST place a new order (mirrors your processCheckout in CashierDashboard.java)
router.post('/', async (req, res) => {
  const { employee_id, items } = req.body;
  // items = [{ menu_item_id, sale_price, addons: [{ add_on_menu_item_id, quantity }] }]

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Calculate total
    let total = items.reduce((sum, item) => sum + parseFloat(item.sale_price), 0);

    // Insert order
    const orderResult = await client.query(
      'INSERT INTO Orders (employee_id, order_timestamp, total_amount) VALUES ($1, NOW(), $2) RETURNING order_id',
      [employee_id, total.toFixed(2)]
    );
    const order_id = orderResult.rows[0].order_id;

    // Insert line items and addons
    for (const item of items) {
      const lineResult = await client.query(
        'INSERT INTO Order_Line_Items (order_id, menu_item_id, quantity, sale_price) VALUES ($1, $2, $3, $4) RETURNING line_item_id',
        [order_id, item.menu_item_id, item.quantity || 1, item.sale_price]
      );
      const line_item_id = lineResult.rows[0].line_item_id;

      if (item.addons && item.addons.length > 0) {
        for (const addon of item.addons) {
          await client.query(
            'INSERT INTO Line_Item_Add_Ons (line_item_id, add_on_menu_item_id, quantity) VALUES ($1, $2, $3)',
            [line_item_id, addon.add_on_menu_item_id, addon.quantity || 1]
          );
        }
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, order_id });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Order failed' });
  } finally {
    client.release();
  }
});

// GET recent orders (manager view)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.order_id, o.order_timestamp, o.total_amount,
              e.first_name || ' ' || e.last_name AS employee_name
       FROM Orders o
       JOIN Employees e ON o.employee_id = e.employee_id
       ORDER BY o.order_timestamp DESC
       LIMIT 50`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET sales summary by day (manager chart)
router.get('/summary', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DATE(order_timestamp) AS date, 
              COUNT(*) AS order_count, 
              SUM(total_amount) AS revenue
       FROM Orders
       WHERE order_timestamp >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(order_timestamp)
       ORDER BY date`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

module.exports = router;