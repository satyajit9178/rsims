// Import jsonwebtoken
const jwt = require('jsonwebtoken');

// This function runs BEFORE protected routes
const verifyToken = (req, res, next) => {

  // Step 1: Get token from request headers
  const authHeader = req.headers['authorization'];

  // Step 2: Check if token exists
  if (!authHeader) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  // Token format is: "Bearer eyJhbGc..."
  // We split by space and take second part
  const token = authHeader.split(' ')[1];

  try {
    // Step 3: Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Step 4: Attach user info to request
    // Now any route can access req.user
    req.user = decoded;

    // Step 5: Move to next function (the actual route)
    next();

  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }

};

module.exports = verifyToken;