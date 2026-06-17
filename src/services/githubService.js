/**
 * GitHub Service
 *
 * Business logic layer responsible for:
 *   1. Fetching data from the GitHub REST API.
 *   2. Processing and analyzing the data using the insight generator.
 *   3. Persisting results via the profile repository.
 *
 * Handles GitHub API errors (404, 403 rate-limit, network) gracefully.
 */

import axios from 'axios';
import profileRepository from '../repositories/profileRepository.js';
import {
  calculateScore,
  getTopLanguages,
  getMostStarredRepo,
  getTotalStars,
  getTotalForks,
  getAccountAgeYears,
  generateSummary,
} from '../utils/insightGenerator.js';

// Base URL for the GitHub REST API
const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Build Axios request headers, optionally including the GitHub token
 * to raise the rate limit from 60 → 5 000 requests/hour.
 * @returns {Object} Headers object.
 */
const getHeaders = () => {
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'GitHub-Profile-Analyzer/1.0',
  };

  if (process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN !== 'your_github_token') {
    headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
};

/**
 * Fetch a GitHub user profile.
 * @param {string} username
 * @returns {Promise<Object>} GitHub user object.
 */
const fetchGitHubProfile = async (username) => {
  try {
    const { data } = await axios.get(`${GITHUB_API_BASE}/users/${username}`, {
      headers: getHeaders(),
      timeout: 10000,
    });
    return data;
  } catch (error) {
    handleGitHubError(error, username);
  }
};

/**
 * Fetch all public repositories for a user (up to 100).
 * @param {string} username
 * @returns {Promise<Array>} Array of repository objects.
 */
const fetchGitHubRepos = async (username) => {
  try {
    const { data } = await axios.get(
      `${GITHUB_API_BASE}/users/${username}/repos`,
      {
        headers: getHeaders(),
        params: { per_page: 100, sort: 'updated', direction: 'desc' },
        timeout: 10000,
      }
    );
    return data;
  } catch (error) {
    handleGitHubError(error, username);
  }
};

/**
 * Translate Axios / GitHub API errors into application-level errors
 * with appropriate HTTP status codes.
 * @param {Error} error
 * @param {string} username
 */
const handleGitHubError = (error, username) => {
  if (error.response) {
    const { status } = error.response;

    if (status === 404) {
      const err = new Error(`GitHub user '${username}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (status === 403) {
      const remaining = error.response.headers['x-ratelimit-remaining'];
      if (remaining === '0') {
        const resetTime = error.response.headers['x-ratelimit-reset'];
        const resetDate = resetTime
          ? new Date(parseInt(resetTime, 10) * 1000).toISOString()
          : 'unknown';
        const err = new Error(
          `GitHub API rate limit exceeded. Resets at ${resetDate}. Consider adding a GITHUB_TOKEN to .env.`
        );
        err.statusCode = 429;
        throw err;
      }

      const err = new Error('GitHub API access forbidden.');
      err.statusCode = 403;
      throw err;
    }

    const err = new Error(`GitHub API error: ${error.response.data?.message || 'Unknown error'}`);
    err.statusCode = status;
    throw err;
  }

  // Network or timeout error
  const err = new Error(`Failed to reach GitHub API: ${error.message}`);
  err.statusCode = 502;
  throw err;
};

/**
 * Full analysis pipeline:
 *   1. Fetch profile from GitHub API.
 *   2. Fetch repositories.
 *   3. Generate insights.
 *   4. Upsert into the database.
 *
 * @param {string} username - GitHub username to analyze.
 * @returns {Promise<{message: string, data: Object}>}
 */
const analyzeProfile = async (username) => {
  // Step 1: Fetch profile
  const profile = await fetchGitHubProfile(username);

  // Step 2: Fetch repositories
  const repos = await fetchGitHubRepos(username);

  // Step 3: Generate insights
  const totalStars = getTotalStars(repos);
  const totalForks = getTotalForks(repos);
  const mostStarred = getMostStarredRepo(repos);
  const topLanguages = getTopLanguages(repos, 5);
  const accountAgeYears = getAccountAgeYears(profile.created_at);

  const reposAnalyzed = repos.length;
  const avgStars = reposAnalyzed > 0
    ? parseFloat((totalStars / reposAnalyzed).toFixed(2))
    : 0;
  const avgForks = reposAnalyzed > 0
    ? parseFloat((totalForks / reposAnalyzed).toFixed(2))
    : 0;

  const score = calculateScore({
    publicRepos: profile.public_repos,
    followers: profile.followers,
    totalStars,
    totalForks,
    accountAgeYears,
  });

  const summary = generateSummary({
    name: profile.name || profile.login,
    publicRepos: profile.public_repos,
    followers: profile.followers,
    following: profile.following,
    totalStars,
    totalForks,
    topLanguages,
    score,
    accountAgeYears,
  });

  // Build the data object matching the database schema
  const profileData = {
    github_id: profile.id,
    username: profile.login,
    name: profile.name,
    bio: profile.bio,
    company: profile.company,
    location: profile.location,
    blog: profile.blog,
    avatar_url: profile.avatar_url,
    profile_url: profile.html_url,
    public_repos: profile.public_repos,
    followers: profile.followers,
    following: profile.following,
    public_gists: profile.public_gists,
    account_created_at: new Date(profile.created_at)
      .toISOString()
      .slice(0, 19)
      .replace('T', ' '),
    last_github_update: new Date(profile.updated_at)
      .toISOString()
      .slice(0, 19)
      .replace('T', ' '),
    repos_analyzed: reposAnalyzed,
    total_stars: totalStars,
    total_forks: totalForks,
    most_starred_repo: mostStarred.name,
    most_starred_repo_stars: mostStarred.stars,
    average_stars_per_repo: avgStars,
    average_forks_per_repo: avgForks,
    top_languages: topLanguages,
    analysis_score: score,
    analysis_summary: summary,
  };

  // Step 4: Upsert into database
  const { action, data } = await profileRepository.upsert(profileData);

  const message =
    action === 'updated'
      ? 'Profile updated successfully.'
      : 'Profile analyzed successfully.';

  return { message, data };
};

/**
 * Retrieve all analyzed profiles with filtering options.
 */
const getAllProfiles = async (options) => {
  return profileRepository.findAll(options);
};

/**
 * Retrieve a single profile by username.
 */
const getProfileByUsername = async (username) => {
  const profile = await profileRepository.findByUsername(username);
  if (!profile) {
    const err = new Error(`Analyzed profile for '${username}' not found.`);
    err.statusCode = 404;
    throw err;
  }

  // Parse JSON fields
  if (profile.top_languages && typeof profile.top_languages === 'string') {
    try {
      profile.top_languages = JSON.parse(profile.top_languages);
    } catch {
      // leave as string
    }
  }

  return profile;
};

/**
 * Delete a profile by username.
 */
const deleteProfile = async (username) => {
  const deleted = await profileRepository.deleteByUsername(username);
  if (!deleted) {
    const err = new Error(`Analyzed profile for '${username}' not found.`);
    err.statusCode = 404;
    throw err;
  }
  return true;
};

/**
 * Get aggregated statistics.
 */
const getStats = async () => {
  return profileRepository.getStats();
};

/**
 * Get the leaderboard (top 10 by score).
 */
const getLeaderboard = async () => {
  return profileRepository.getLeaderboard();
};

export default {
  analyzeProfile,
  getAllProfiles,
  getProfileByUsername,
  deleteProfile,
  getStats,
  getLeaderboard,
};
