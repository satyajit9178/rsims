const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');


// ─────────────────────────────────────────
// GET /api/purchases
// Get all purchase history
// ─────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const [purchases] = await db.query(`
      SELECT 
        pu.id,
        p.product_name,
        s.supplier_name,
        pu.quantity,
        pu.cost_at_purchase,
        pu.purchase_date
      FROM purchases pu
      JOIN products p ON pu.product_id = p.id
      JOIN suppliers s ON pu.supplier_id = s.id
      ORDER BY pu.purchase_date DESC
    `);

    res.json(purchases);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


// ─────────────────────────────────────────
// POST /api/purchases
// Record a new purchase (stock increases)
// ─────────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {

  // Only Admin and Manager can record purchases
  if (req.user.role === 'Staff') {
    return res.status(403).json({ message: 'Access denied.' });
  }

  const { product_id, supplier_id, quantity, cost_at_purchase } = req.body;

  if (!product_id || !supplier_id || !quantity) {
    return res.status(400).json({ message: 'Product, supplier and quantity are required.' });
  }

  if (quantity <= 0) {
    return res.status(400).json({ message: 'Quantity must be greater than zero.' });
  }

  try {
    // ─────────────────────────────────────
    // Step 1: Check product exists
    // ─────────────────────────────────────
    const [rows] = await db.query(
      'SELECT * FROM products WHERE id = ?',
      [product_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const product = rows[0];

    // ─────────────────────────────────────
    // Step 2: Increase stock in products table
    // ─────────────────────────────────────
    await db.query(
      'UPDATE products SET current_stock = current_stock + ? WHERE id = ?',
      [quantity, product_id]
    );

    // ─────────────────────────────────────
    // Step 3: Record the purchase
    // ─────────────────────────────────────
    const [result] = await db.query(
      `INSERT INTO purchases (product_id, supplier_id, quantity, cost_at_purchase)
       VALUES (?, ?, ?, ?)`,
      [product_id, supplier_id, quantity, cost_at_purchase]
    );

    const newStock = product.current_stock + quantity;

    res.status(201).json({
      message: 'Purchase recorded successfully',
      purchaseId: result.insertId,
      product: product.product_name,
      quantity_added: quantity,
      new_stock_level: newStock
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;