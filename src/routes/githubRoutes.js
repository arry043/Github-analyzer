/**
 * GitHub Routes
 *
 * Defines all REST API endpoints for the GitHub Profile Analyzer.
 * Maps HTTP methods and paths to controller actions.
 */

import express from 'express';
const router = express.Router();
import * as githubController from '../controllers/githubController.js';

// Analyze a GitHub profile (fetch, score, persist)
router.post('/analyze/:username', githubController.analyzeProfile);

// Retrieve all analyzed profiles (with pagination, sorting, search)
router.get('/profiles', githubController.getAllProfiles);

// Aggregated statistics across all profiles
router.get('/stats', githubController.getStats);

// Leaderboard: top 10 by analysis score
router.get('/leaderboard', githubController.getLeaderboard);

// Retrieve a single analyzed profile by username
router.get('/profiles/:username', githubController.getProfile);

// Delete an analyzed profile by username
router.delete('/profiles/:username', githubController.deleteProfile);

export default router;
