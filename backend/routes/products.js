const express = require('express');
const router = express.Router();

// Import database connection
const db = require('../db');

// Import auth middleware
const verifyToken = require('../middleware/auth');


// ─────────────────────────────────────────
// GET /api/products
// Get all products (protected route)
// ─────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT 
        p.id,
        p.sku,
        p.product_name,
        p.category,
        p.cost_price,
        p.selling_price,
        p.current_stock,
        p.reorder_level,
        p.expiry_date,
        s.supplier_name
      FROM products p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
    `);

    res.json(products);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


// ─────────────────────────────────────────
// POST /api/products
// Add a new product (Admin and Manager only)
// ─────────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {

  // Only Admin and Manager can add products
  if (req.user.role === 'Staff') {
    return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
  }

  const {
    sku,
    product_name,
    category,
    cost_price,
    selling_price,
    current_stock,
    reorder_level,
    supplier_id,
    expiry_date
  } = req.body;

  // Basic validation
  if (!product_name || !selling_price) {
    return res.status(400).json({ message: 'Product name and selling price are required.' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO products 
        (sku, product_name, category, cost_price, selling_price, current_stock, reorder_level, supplier_id, expiry_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sku, product_name, category, cost_price, selling_price, current_stock || 0, reorder_level || 10, supplier_id, expiry_date]
    );

    res.status(201).json({ 
      message: 'Product added successfully',
      productId: result.insertId 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


// ─────────────────────────────────────────
// PUT /api/products/:id
// Update a product
// ─────────────────────────────────────────
router.put('/:id', verifyToken, async (req, res) => {

  if (req.user.role === 'Staff') {
    return res.status(403).json({ message: 'Access denied.' });
  }

  const { id } = req.params;
  const {
    sku,
    product_name,
    category,
    cost_price,
    selling_price,
    reorder_level,
    supplier_id,
    expiry_date
  } = req.body;

  try {
    await db.query(
      `UPDATE products SET 
        sku=?, product_name=?, category=?, cost_price=?, 
        selling_price=?, reorder_level=?, supplier_id=?, expiry_date=?
       WHERE id=?`,
      [sku, product_name, category, cost_price, selling_price, reorder_level, supplier_id, expiry_date, id]
    );

    res.json({ message: 'Product updated successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


// ─────────────────────────────────────────
// DELETE /api/products/:id
// Delete a product (Admin only)
// ─────────────────────────────────────────
router.delete('/:id', verifyToken, async (req, res) => {

  // Only Admin can delete
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }

  const { id } = req.params;

  try {
    await db.query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ message: 'Product deleted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;