const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');


// ─────────────────────────────────────────
// GET /api/sales
// Get all sales history
// ─────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const [sales] = await db.query(`
      SELECT 
        s.id,
        p.product_name,
        s.quantity,
        s.total_price,
        s.sale_date,
        u.username AS sold_by
      FROM sales s
      JOIN products p ON s.product_id = p.id
      JOIN users u ON s.user_id = u.id
      ORDER BY s.sale_date DESC
    `);

    res.json(sales);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


// ─────────────────────────────────────────
// POST /api/sales
// Record a new sale
// THIS IS THE CORE LOGIC
// ─────────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {

  const { product_id, quantity } = req.body;

  // Basic validation
  if (!product_id || !quantity) {
    return res.status(400).json({ message: 'Product and quantity are required.' });
  }

  if (quantity <= 0) {
    return res.status(400).json({ message: 'Quantity must be greater than zero.' });
  }

  try {
    // ─────────────────────────────────────
    // Step 1: Find the product in database
    // ─────────────────────────────────────
    const [rows] = await db.query(
      'SELECT * FROM products WHERE id = ?',
      [product_id]
    );

    // If product not found
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const product = rows[0];

    // ─────────────────────────────────────
    // Step 2: Check if enough stock exists
    // ─────────────────────────────────────
    if (product.current_stock < quantity) {
      return res.status(400).json({ 
        message: `Insufficient stock. Available: ${product.current_stock}, Requested: ${quantity}` 
      });
    }

    // ─────────────────────────────────────
    // Step 3: Calculate total price
    // ─────────────────────────────────────
    const total_price = product.selling_price * quantity;

    // ─────────────────────────────────────
    // Step 4: Reduce stock in products table
    // ─────────────────────────────────────
    await db.query(
      'UPDATE products SET current_stock = current_stock - ? WHERE id = ?',
      [quantity, product_id]
    );

    // ─────────────────────────────────────
    // Step 5: Record the sale
    // ─────────────────────────────────────
    const [result] = await db.query(
      `INSERT INTO sales (product_id, user_id, quantity, total_price)
       VALUES (?, ?, ?, ?)`,
      [product_id, req.user.id, quantity, total_price]
    );

    // ─────────────────────────────────────
    // Step 6: Check if stock is now low
    // ─────────────────────────────────────
    const newStock = product.current_stock - quantity;
    let alert = null;

    if (newStock <= product.reorder_level) {
      alert = `⚠️ Low stock alert: ${product.product_name} has only ${newStock} units left. Please reorder.`;
    }

    // ─────────────────────────────────────
    // Step 7: Send response
    // ─────────────────────────────────────
    res.status(201).json({
      message: 'Sale recorded successfully',
      saleId: result.insertId,
      product: product.product_name,
      quantity_sold: quantity,
      total_price: total_price,
      remaining_stock: newStock,
      alert: alert  // null if stock is fine, message if low
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;