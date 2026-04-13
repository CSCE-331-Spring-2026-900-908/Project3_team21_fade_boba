// routes/auth.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google', async (req, res) => {
  const { token } = req.body;
  
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { sub: google_id, email, given_name, family_name } = payload;

    // 1. Check if the user is an Employee (Manager/Cashier)
    const employeeCheck = await pool.query(
      'SELECT employee_id, first_name, last_name, role FROM Employees WHERE email = $1',
      [email]
    );

    if (employeeCheck.rows.length > 0) {
      return res.json({ 
        success: true, 
        userType: 'employee', 
        user: employeeCheck.rows[0] 
      });
    }

    // 2. If not an employee, handle as a Customer
    let customerQuery = await pool.query(
      'SELECT * FROM Customers WHERE email = $1',
      [email]
    );

    let customer;

    // 3. Auto-register new customers
    if (customerQuery.rows.length === 0) {
      const newCustomer = await pool.query(
        'INSERT INTO Customers (google_id, email, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING *',
        [google_id, email, given_name, family_name]
      );
      customer = newCustomer.rows[0];
    } else {
      customer = customerQuery.rows[0];
    }

    res.json({ 
      success: true, 
      userType: 'customer', 
      user: customer 
    });

  } catch (err) {
    console.error('OAuth Error:', err);
    res.status(401).json({ error: 'Invalid authentication token' });
  }
});

router.post('/pin', async (req, res) => {
  const { pin } = req.body;

  try {
    const result = await pool.query(
      'SELECT employee_id, first_name, last_name, role FROM Employees WHERE pin = $1',
      [pin]
    );

    if (result.rows.length === 0) {
      return res.json({ success: false });
    }

    res.json({
      success: true,
      userType: 'employee',
      user: result.rows[0],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;