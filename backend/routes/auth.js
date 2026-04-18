// Import express and create a router
const express = require('express');
const router = express.Router();

// Import bcrypt for password comparison
const bcrypt = require('bcryptjs');

// Import jsonwebtoken to create token
const jwt = require('jsonwebtoken');

// Import database connection
const db = require('../db');

// POST /api/auth/login
// This route handles login requests
router.post('/login', async (req, res) => {

  // Step 1: Get username and password from request body
  const { username, password } = req.body;

  // Step 2: Basic validation
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required' });
  }

  try {
    // Step 3: Check if user exists in database
    const [rows] = await db.query(
      'SELECT * FROM users WHERE username = ?', 
      [username]
    );

    // If no user found
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];

    // Step 4: Compare entered password with hashed password in DB
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Step 5: Create a token with user info
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }  // Token expires in 8 hours
    );

    // Step 6: Send token back to frontend
    res.json({
      message: 'Login successful',
      token: token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }

});

module.exports = router;