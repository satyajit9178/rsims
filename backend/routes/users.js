const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const db      = require('../db');
const verifyToken = require('../middleware/auth');

// GET /api/users — Admin only
router.get('/', verifyToken, async (req, res) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Admins only.' });
  }
  try {
    const [rows] = await db.query(
      'SELECT id, username, role, created_at FROM users ORDER BY id ASC'
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/users — Admin only
router.post('/', verifyToken, async (req, res) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Admins only.' });
  }

  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Username, password and role required.' });
  }

  if (!['Admin', 'Manager', 'Staff'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role.' });
  }

  try {
    // Check if username already exists
    const [existing] = await db.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Username already exists.' });
    }

    // Hash the password
    const hash = await bcrypt.hash(password, 10);

    // Insert new user
    const [result] = await db.query(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      [username, hash, role]
    );

    res.status(201).json({
      message: 'User created successfully.',
      userId: result.insertId
    });

  } catch (e) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/users/:id — Admin only
router.delete('/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Admins only.' });
  }

  // Prevent admin from deleting themselves
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ message: 'Cannot delete your own account.' });
  }

  try {
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted.' });
  } catch (e) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;