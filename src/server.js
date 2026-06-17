/**
 * Server Entry Point
 *
 * Starts the Express server and initializes the database connection.
 * Separated from app.js so that test suites can import the app
 * without actually starting a listening server.
 */

import 'dotenv/config';
import app from './app.js';
import { testConnection } from './config/db.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Verify database connectivity before accepting traffic
  console.log("DB_HOST =", process.env.DB_HOST);
  console.log("DB_USER =", process.env.DB_USER);
  console.log("DB_PASSWORD =", process.env.DB_PASSWORD);
  console.log("DB_NAME =", process.env.DB_NAME);
  await testConnection();

  app.listen(PORT, () => {
    console.log(`\n🚀 GitHub Profile Analyzer API`);
    console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Server      : http://localhost:${PORT}`);
    console.log(`   API Docs    : http://localhost:${PORT}/api-docs`);
    console.log(`   Health      : http://localhost:${PORT}/api/health\n`);
  });
};

startServer();
