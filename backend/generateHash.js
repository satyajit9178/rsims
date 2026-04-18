const bcrypt = require('bcryptjs');

const password = 'admin123';

// Generate hash
bcrypt.hash(password, 10, (err, hash) => {
  console.log('Hashed password:', hash);
});