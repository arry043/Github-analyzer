/**
 * GitHub Profile Analyzer — Integration & Unit Tests
 *
 * Tests cover:
 *   - Health check endpoint
 *   - Analyze profile endpoint (valid + invalid usernames, GitHub 404)
 *   - Profile retrieval (single + list)
 *   - Profile deletion
 *   - Stats endpoint
 *   - Leaderboard endpoint
 *   - 404 route handling
 *   - Insight generator unit tests
 *
 * These tests mock the GitHub API and MySQL pool so they can run
 * without external dependencies (CI-friendly).
 */

import { jest } from '@jest/globals';
import request from 'supertest';
import {
  calculateScore,
  getTopLanguages,
  getMostStarredRepo,
  getTotalStars,
  getTotalForks,
  getAccountAgeYears,
  generateSummary,
} from '../src/utils/insightGenerator.js';

// ---------------------------------------------------------------------------
// Mock mysql2/promise BEFORE requiring the app
// ---------------------------------------------------------------------------
const mockExecute = jest.fn();
const mockGetConnection = jest.fn().mockResolvedValue({ release: jest.fn() });

jest.mock('mysql2/promise', () => ({
  createPool: jest.fn(() => ({
    execute: mockExecute,
    getConnection: mockGetConnection,
  })),
}));

// ---------------------------------------------------------------------------
// Mock Axios to avoid real GitHub API calls
// ---------------------------------------------------------------------------
jest.unstable_mockModule('axios', () => {
  const mockAxiosGet = jest.fn();
  return {
    default: {
      get: mockAxiosGet,
    },
    get: mockAxiosGet,
  };
});

// ---------------------------------------------------------------------------
// Dynamically import the app and mocked modules to ensure mocks are active first
// ---------------------------------------------------------------------------
let axios;
let app;
beforeAll(async () => {
  axios = (await import('axios')).default;
  app = (await import('../src/app.js')).default;
});

// ---------------------------------------------------------------------------
// Sample GitHub API responses used across tests
// ---------------------------------------------------------------------------
const sampleGitHubUser = {
  id: 583231,
  login: 'octocat',
  name: 'The Octocat',
  bio: 'GitHub mascot',
  company: '@github',
  location: 'San Francisco',
  blog: 'https://github.blog',
  avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4',
  html_url: 'https://github.com/octocat',
  public_repos: 8,
  followers: 14000,
  following: 9,
  public_gists: 8,
  created_at: '2011-01-25T18:44:36Z',
  updated_at: '2024-06-01T00:00:00Z',
};

const sampleRepos = [
  { name: 'Hello-World', language: 'Ruby', stargazers_count: 2500, forks_count: 1200 },
  { name: 'Spoon-Knife', language: 'HTML', stargazers_count: 1300, forks_count: 500 },
  { name: 'octocat.github.io', language: 'CSS', stargazers_count: 200, forks_count: 100 },
  { name: 'linguist', language: 'Ruby', stargazers_count: 1800, forks_count: 200 },
  { name: 'git-consortium', language: null, stargazers_count: 400, forks_count: 100 },
];

const sampleDbProfile = {
  id: 1,
  github_id: 583231,
  username: 'octocat',
  name: 'The Octocat',
  bio: 'GitHub mascot',
  company: '@github',
  location: 'San Francisco',
  blog: 'https://github.blog',
  avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4',
  profile_url: 'https://github.com/octocat',
  public_repos: 8,
  followers: 14000,
  following: 9,
  public_gists: 8,
  repos_analyzed: 5,
  total_stars: 6200,
  total_forks: 2100,
  most_starred_repo: 'Hello-World',
  most_starred_repo_stars: 2500,
  average_stars_per_repo: 1240.00,
  average_forks_per_repo: 420.00,
  top_languages: '[{"language":"Ruby","count":2,"percentage":"50.0%"},{"language":"HTML","count":1,"percentage":"25.0%"},{"language":"CSS","count":1,"percentage":"25.0%"}]',
  analysis_score: 72,
  analysis_summary: 'The Octocat is a highly active GitHub contributor.',
  analyzed_at: '2024-01-15T00:00:00.000Z',
  updated_at: '2024-01-15T00:00:00.000Z',
};

// ---------------------------------------------------------------------------
// Reset all mocks before each test
// ---------------------------------------------------------------------------
beforeEach(() => {
  jest.clearAllMocks();
});

// ==========================================================================
// 1. Health Check
// ==========================================================================
describe('GET /api/health', () => {
  it('should return 200 with health status', async () => {
    const res = await request(app).get('/api/health');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('running');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('environment');
  });
});

// ==========================================================================
// 2. Analyze Profile
// ==========================================================================
describe('POST /api/github/analyze/:username', () => {
  it('should analyze a valid GitHub profile and create a new record', async () => {
    // Mock GitHub API calls
    axios.get.mockImplementation((url) => {
      if (url.includes('/repos')) {
        return Promise.resolve({ data: sampleRepos });
      }
      return Promise.resolve({ data: sampleGitHubUser });
    });

    // Mock DB: findByUsername returns null (new user), then returns the inserted row
    mockExecute
      .mockResolvedValueOnce([[]])                  // SELECT (findByUsername — not found)
      .mockResolvedValueOnce([{ insertId: 1 }])     // INSERT
      .mockResolvedValueOnce([[sampleDbProfile]]);   // SELECT (findByUsername — after insert)

    const res = await request(app)
      .post('/api/github/analyze/octocat');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Profile analyzed successfully.');
    expect(res.body.data).toBeDefined();
    expect(res.body.data.username).toBe('octocat');
  });

  it('should update an existing profile on re-analysis', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('/repos')) {
        return Promise.resolve({ data: sampleRepos });
      }
      return Promise.resolve({ data: sampleGitHubUser });
    });

    // Mock DB: findByUsername returns existing, then update, then return updated
    mockExecute
      .mockResolvedValueOnce([[sampleDbProfile]])     // SELECT (found)
      .mockResolvedValueOnce([{ affectedRows: 1 }])   // UPDATE
      .mockResolvedValueOnce([[sampleDbProfile]]);     // SELECT (after update)

    const res = await request(app)
      .post('/api/github/analyze/octocat');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Profile updated successfully.');
  });

  it('should return 400 for an invalid username', async () => {
    const res = await request(app)
      .post('/api/github/analyze/invalid!!user');

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid username');
  });

  it('should return 400 for a username starting with a hyphen', async () => {
    const res = await request(app)
      .post('/api/github/analyze/-badname');

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 404 when GitHub user does not exist', async () => {
    axios.get.mockRejectedValue({
      response: { status: 404, data: { message: 'Not Found' } },
    });

    const res = await request(app)
      .post('/api/github/analyze/thisuserdoesnotexist12345');

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('not found');
  });

  it('should return 429 when GitHub rate limit is exceeded', async () => {
    axios.get.mockRejectedValue({
      response: {
        status: 403,
        data: { message: 'API rate limit exceeded' },
        headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1700000000' },
      },
    });

    const res = await request(app)
      .post('/api/github/analyze/octocat');

    expect(res.statusCode).toBe(429);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('rate limit');
  });
});

// ==========================================================================
// 3. Get All Profiles
// ==========================================================================
describe('GET /api/github/profiles', () => {
  it('should return paginated profiles', async () => {
    mockExecute
      .mockResolvedValueOnce([[{ total: 1 }]])        // COUNT
      .mockResolvedValueOnce([[sampleDbProfile]]);      // SELECT

    const res = await request(app)
      .get('/api/github/profiles?page=1&limit=10');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('count');
    expect(res.body).toHaveProperty('pagination');
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should support search parameter', async () => {
    mockExecute
      .mockResolvedValueOnce([[{ total: 1 }]])
      .mockResolvedValueOnce([[sampleDbProfile]]);

    const res = await request(app)
      .get('/api/github/profiles?search=octocat');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should support sorting', async () => {
    mockExecute
      .mockResolvedValueOnce([[{ total: 1 }]])
      .mockResolvedValueOnce([[sampleDbProfile]]);

    const res = await request(app)
      .get('/api/github/profiles?sortBy=followers&sortOrder=desc');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ==========================================================================
// 4. Get Single Profile
// ==========================================================================
describe('GET /api/github/profiles/:username', () => {
  it('should return a single profile', async () => {
    mockExecute.mockResolvedValueOnce([[sampleDbProfile]]);

    const res = await request(app)
      .get('/api/github/profiles/octocat');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.username).toBe('octocat');
  });

  it('should return 404 for a profile that has not been analyzed', async () => {
    mockExecute.mockResolvedValueOnce([[]]);

    const res = await request(app)
      .get('/api/github/profiles/unknownuser');

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('not found');
  });

  it('should return 400 for an invalid username parameter', async () => {
    const res = await request(app)
      .get('/api/github/profiles/!!invalid');

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ==========================================================================
// 5. Delete Profile
// ==========================================================================
describe('DELETE /api/github/profiles/:username', () => {
  it('should delete an existing profile', async () => {
    mockExecute.mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app)
      .delete('/api/github/profiles/octocat');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('deleted');
  });

  it('should return 404 when deleting a non-existent profile', async () => {
    mockExecute.mockResolvedValueOnce([{ affectedRows: 0 }]);

    const res = await request(app)
      .delete('/api/github/profiles/unknownuser');

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ==========================================================================
// 6. Stats Endpoint
// ==========================================================================
describe('GET /api/github/stats', () => {
  it('should return aggregated statistics', async () => {
    mockExecute
      .mockResolvedValueOnce([[{
        totalProfiles: 3,
        averageFollowers: 86266.67,
        averageRepos: 27.00,
        averageScore: 85.00,
      }]])
      .mockResolvedValueOnce([[
        { username: 'torvalds', name: 'Linus Torvalds', analysis_score: 98, followers: 221000, total_stars: 175000 },
        { username: 'mojombo', name: 'Tom Preston-Werner', analysis_score: 85, followers: 23800, total_stars: 15000 },
      ]]);

    const res = await request(app)
      .get('/api/github/stats');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totalProfiles');
    expect(res.body.data).toHaveProperty('averageFollowers');
    expect(res.body.data).toHaveProperty('averageRepos');
    expect(res.body.data).toHaveProperty('averageScore');
    expect(res.body.data).toHaveProperty('topDevelopers');
    expect(Array.isArray(res.body.data.topDevelopers)).toBe(true);
  });

  it('should handle empty database gracefully', async () => {
    mockExecute
      .mockResolvedValueOnce([[{
        totalProfiles: 0,
        averageFollowers: null,
        averageRepos: null,
        averageScore: null,
      }]])
      .mockResolvedValueOnce([[]]);

    const res = await request(app)
      .get('/api/github/stats');

    expect(res.statusCode).toBe(200);
    expect(res.body.data.totalProfiles).toBe(0);
    expect(res.body.data.averageFollowers).toBe(0);
  });
});

// ==========================================================================
// 7. Leaderboard Endpoint
// ==========================================================================
describe('GET /api/github/leaderboard', () => {
  it('should return a leaderboard sorted by score', async () => {
    mockExecute.mockResolvedValueOnce([[
      { ...sampleDbProfile, analysis_score: 98, username: 'torvalds' },
      { ...sampleDbProfile, analysis_score: 85, username: 'mojombo' },
      { ...sampleDbProfile, analysis_score: 72, username: 'octocat' },
    ]]);

    const res = await request(app)
      .get('/api/github/leaderboard');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('count');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeLessThanOrEqual(10);
  });

  it('should return empty array when no profiles exist', async () => {
    mockExecute.mockResolvedValueOnce([[]]);

    const res = await request(app)
      .get('/api/github/leaderboard');

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.count).toBe(0);
  });
});

// ==========================================================================
// 8. 404 — Unknown Routes
// ==========================================================================
describe('Unknown routes', () => {
  it('should return 404 for undefined routes', async () => {
    const res = await request(app)
      .get('/api/nonexistent');

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Route not found');
  });
});

// ==========================================================================
// 9. Insight Generator Unit Tests
// ==========================================================================
describe('Insight Generator', () => {

  describe('calculateScore', () => {
    it('should return 0 for a brand-new empty profile', () => {
      const score = calculateScore({
        publicRepos: 0,
        followers: 0,
        totalStars: 0,
        totalForks: 0,
        accountAgeYears: 0,
      });
      expect(score).toBe(0);
    });

    it('should return a score between 0 and 100', () => {
      const score = calculateScore({
        publicRepos: 50,
        followers: 500,
        totalStars: 1000,
        totalForks: 200,
        accountAgeYears: 5,
      });
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should cap at 100 for very active profiles', () => {
      const score = calculateScore({
        publicRepos: 200,
        followers: 100000,
        totalStars: 50000,
        totalForks: 20000,
        accountAgeYears: 15,
      });
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('getTopLanguages', () => {
    it('should return top languages sorted by count', () => {
      const result = getTopLanguages(sampleRepos, 3);
      expect(result.length).toBeLessThanOrEqual(3);
      expect(result[0].language).toBe('Ruby');
      expect(result[0].count).toBe(2);
    });

    it('should handle repos with no languages', () => {
      const result = getTopLanguages([{ language: null }, { language: null }]);
      expect(result).toEqual([]);
    });
  });

  describe('getMostStarredRepo', () => {
    it('should return the repo with the most stars', () => {
      const result = getMostStarredRepo(sampleRepos);
      expect(result.name).toBe('Hello-World');
      expect(result.stars).toBe(2500);
    });

    it('should handle empty repo list', () => {
      const result = getMostStarredRepo([]);
      expect(result.name).toBe('N/A');
      expect(result.stars).toBe(0);
    });
  });

  describe('getTotalStars', () => {
    it('should sum all stars', () => {
      expect(getTotalStars(sampleRepos)).toBe(6200);
    });

    it('should return 0 for empty repos', () => {
      expect(getTotalStars([])).toBe(0);
    });
  });

  describe('getTotalForks', () => {
    it('should sum all forks', () => {
      expect(getTotalForks(sampleRepos)).toBe(2100);
    });
  });

  describe('getAccountAgeYears', () => {
    it('should return a positive number for past dates', () => {
      const age = getAccountAgeYears('2015-01-01T00:00:00Z');
      expect(age).toBeGreaterThan(0);
    });
  });

  describe('generateSummary', () => {
    it('should return a non-empty string', () => {
      const summary = generateSummary({
        name: 'Test User',
        publicRepos: 10,
        followers: 100,
        following: 50,
        totalStars: 500,
        totalForks: 100,
        topLanguages: [{ language: 'JavaScript', count: 5, percentage: '50%' }],
        score: 55,
        accountAgeYears: 3,
      });
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
      expect(summary).toContain('Test User');
    });

    it('should handle zero following (division by zero)', () => {
      const summary = generateSummary({
        name: 'Solo',
        publicRepos: 5,
        followers: 200,
        following: 0,
        totalStars: 50,
        totalForks: 10,
        topLanguages: [],
        score: 30,
        accountAgeYears: 1,
      });
      expect(summary).toContain('Solo');
    });
  });
});
