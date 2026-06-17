/**
 * GitHub Controller
 *
 * Handles HTTP request/response for all GitHub-related endpoints.
 * Delegates business logic to the service layer.
 * Performs request validation and formats responses.
 */

import githubService from '../services/githubService.js';

/**
 * Regex for valid GitHub usernames:
 *   - Alphanumeric characters and hyphens only
 *   - Cannot start or end with a hyphen
 *   - Cannot contain consecutive hyphens
 *   - Max 39 characters (GitHub's limit)
 */
const USERNAME_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

/**
 * Validate a GitHub username.
 * @param {string} username
 * @returns {string|null} Error message or null if valid.
 */
const validateUsername = (username) => {
  if (!username || typeof username !== 'string') {
    return 'Username is required.';
  }
  if (!USERNAME_REGEX.test(username)) {
    return 'Invalid username. Only alphanumeric characters and hyphens are allowed (cannot start/end with a hyphen, max 39 characters).';
  }
  return null;
};

/**
 * POST /api/github/analyze/:username
 * Analyze a GitHub profile and store insights.
 */
const analyzeProfile = async (req, res, next) => {
  try {
    const { username } = req.params;

    // Validate username
    const validationError = validateUsername(username);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const result = await githubService.analyzeProfile(username);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/github/profiles
 * Retrieve all analyzed profiles with pagination, sorting, and search.
 */
const getAllProfiles = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'analyzed_at',
      sortOrder = 'desc',
      search = '',
    } = req.query;

    const options = {
      page: Math.max(1, parseInt(page, 10) || 1),
      limit: Math.min(100, Math.max(1, parseInt(limit, 10) || 10)),
      sortBy,
      sortOrder,
      search,
    };

    const result = await githubService.getAllProfiles(options);

    return res.status(200).json({
      success: true,
      count: result.count,
      pagination: result.pagination,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/github/profiles/:username
 * Retrieve a single analyzed profile.
 */
const getProfile = async (req, res, next) => {
  try {
    const { username } = req.params;

    const validationError = validateUsername(username);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const profile = await githubService.getProfileByUsername(username);

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/github/profiles/:username
 * Delete an analyzed profile.
 */
const deleteProfile = async (req, res, next) => {
  try {
    const { username } = req.params;

    const validationError = validateUsername(username);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    await githubService.deleteProfile(username);

    return res.status(200).json({
      success: true,
      message: `Profile '${username}' deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/github/stats
 * Return aggregated statistics.
 */
const getStats = async (req, res, next) => {
  try {
    const stats = await githubService.getStats();

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/github/leaderboard
 * Return top 10 developers by analysis score.
 */
const getLeaderboard = async (req, res, next) => {
  try {
    const leaderboard = await githubService.getLeaderboard();

    return res.status(200).json({
      success: true,
      count: leaderboard.length,
      data: leaderboard,
    });
  } catch (error) {
    next(error);
  }
};

export {
  analyzeProfile,
  getAllProfiles,
  getProfile,
  deleteProfile,
  getStats,
  getLeaderboard,
};
