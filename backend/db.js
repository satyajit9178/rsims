// Import the mysql2 library
const mysql = require('mysql2');

// Import dotenv so we can read our .env file
require('dotenv').config();

// Create a connection pool to MySQL
const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
});

// Export it so other files can use it
module.exports = pool.promise();