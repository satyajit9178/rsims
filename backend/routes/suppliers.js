const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');


// ─────────────────────────────────────────
// GET /api/suppliers
// Get all suppliers
// ─────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const [suppliers] = await db.query('SELECT * FROM suppliers');
    res.json(suppliers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


// ─────────────────────────────────────────
// POST /api/suppliers
// Add a new supplier (Admin and Manager only)
// ─────────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {

  if (req.user.role === 'Staff') {
    return res.status(403).json({ message: 'Access denied.' });
  }

  const { supplier_name, contact_person, phone, email, address } = req.body;

  if (!supplier_name) {
    return res.status(400).json({ message: 'Supplier name is required.' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO suppliers (supplier_name, contact_person, phone, email, address)
       VALUES (?, ?, ?, ?, ?)`,
      [supplier_name, contact_person, phone, email, address]
    );

    res.status(201).json({
      message: 'Supplier added successfully',
      supplierId: result.insertId
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;