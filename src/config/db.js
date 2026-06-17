/**
 * Database Configuration
 *
 * Creates and exports a MySQL connection pool using mysql2/promise.
 * Connection pooling improves performance by reusing connections
 * instead of creating new ones for each query.
 */

import mysql from 'mysql2/promise';
import 'dotenv/config';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'github_profile_analyzer',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Ensure proper date handling
  dateStrings: true,
  // Enable multiple statements for schema initialization
  multipleStatements: false,
});

/**
 * Test the database connection on startup.
 * Logs success or failure and exits on critical failure in production.
 */
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL database connected successfully');
    connection.release();
  } catch (error) {
    console.error('MySQL connection failed:', error.message);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

export { pool, testConnection };
