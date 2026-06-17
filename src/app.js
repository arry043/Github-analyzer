/**
 * Express Application Setup
 *
 * Configures all middleware, routes, error handling, and Swagger docs.
 * Exports the app for both the server entry-point and test suites.
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import githubRoutes from './routes/githubRoutes.js';
import errorHandler from './middlewares/errorHandler.js';
import notFound from './middlewares/notFound.js';
import { setupSwagger } from './config/swagger.js';

const app = express();

// ---------------------------------------------------------------------------
// Security Middleware
// ---------------------------------------------------------------------------

// Set various HTTP security headers
app.use(helmet());

// Enable Cross-Origin Resource Sharing
app.use(cors());

// Gzip / Brotli compression for responses
app.use(compression());

// Request logging (skip in test to keep output clean)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------------------------
// Rate Limiting — 100 requests per 15-minute window
// ---------------------------------------------------------------------------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again after 15 minutes.',
  },
});

app.use(limiter);

// ---------------------------------------------------------------------------
// Swagger Documentation
// ---------------------------------------------------------------------------
setupSwagger(app);

// ---------------------------------------------------------------------------
// Health-check endpoint
// ---------------------------------------------------------------------------
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'GitHub Profile Analyzer API is running.',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------
app.use('/api/github', githubRoutes);

// ---------------------------------------------------------------------------
// 404 & Error Handling
// ---------------------------------------------------------------------------
app.use(notFound);
app.use(errorHandler);

export default app;
