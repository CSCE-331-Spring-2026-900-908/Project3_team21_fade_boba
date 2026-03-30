// routes/employees.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST login - look up employee by ID (mirrors LoginScreen.java)
router.post('/login', async (req, res) => {
  const { employee_id } = req.body;
  try {
    const result = await pool.query(
      'SELECT employee_id, first_name, last_name, role FROM Employees WHERE employee_id = $1',
      [employee_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET all employees (manager view)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT employee_id, first_name, last_name, role FROM Employees ORDER BY last_name'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

module.exports = router;