/**
 * Insight Generator Utility
 *
 * Contains the scoring algorithm and summary generator
 * used to produce human-readable analysis insights
 * from raw GitHub profile and repository data.
 */

/**
 * Calculate the analysis score (0–100) for a GitHub profile.
 *
 * Scoring breakdown:
 *   Repositories  — 30 pts  (log-scaled, cap at 100 repos)
 *   Followers     — 25 pts  (log-scaled, cap at 10 000 followers)
 *   Stars         — 25 pts  (log-scaled, cap at 5 000 stars)
 *   Forks         — 10 pts  (log-scaled, cap at 2 000 forks)
 *   Account Age   — 10 pts  (linear, cap at 10 years)
 *
 * @param {Object} params
 * @param {number} params.publicRepos
 * @param {number} params.followers
 * @param {number} params.totalStars
 * @param {number} params.totalForks
 * @param {number} params.accountAgeYears
 * @returns {number} Score between 0 and 100.
 */
const calculateScore = ({ publicRepos, followers, totalStars, totalForks, accountAgeYears }) => {
  // Helper: logarithmic scaling with a cap
  const logScale = (value, maxValue, maxPoints) => {
    if (value <= 0) return 0;
    const capped = Math.min(value, maxValue);
    // Using log(1 + x) / log(1 + max) for smooth 0–1 normalization
    const normalized = Math.log(1 + capped) / Math.log(1 + maxValue);
    return Math.round(normalized * maxPoints);
  };

  const repoScore = logScale(publicRepos, 100, 30);
  const followerScore = logScale(followers, 10000, 25);
  const starScore = logScale(totalStars, 5000, 25);
  const forkScore = logScale(totalForks, 2000, 10);

  // Account age: linear with 10-year cap
  const ageScore = Math.min(Math.round((accountAgeYears / 10) * 10), 10);

  return repoScore + followerScore + starScore + forkScore + ageScore;
};

/**
 * Determine the top N languages from an array of repositories.
 * @param {Array<Object>} repos - Repository objects from the GitHub API.
 * @param {number} [topN=5] - Number of languages to return.
 * @returns {Array<{language: string, count: number, percentage: string}>}
 */
const getTopLanguages = (repos, topN = 5) => {
  const languageCount = {};
  let totalWithLanguage = 0;

  for (const repo of repos) {
    if (repo.language) {
      languageCount[repo.language] = (languageCount[repo.language] || 0) + 1;
      totalWithLanguage++;
    }
  }

  const sorted = Object.entries(languageCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN);

  return sorted.map(([language, count]) => ({
    language,
    count,
    percentage: totalWithLanguage > 0
      ? `${((count / totalWithLanguage) * 100).toFixed(1)}%`
      : '0%',
  }));
};

/**
 * Find the most-starred repository.
 * @param {Array<Object>} repos
 * @returns {{name: string, stars: number}}
 */
const getMostStarredRepo = (repos) => {
  if (!repos || repos.length === 0) {
    return { name: 'N/A', stars: 0 };
  }

  const top = repos.reduce(
    (best, repo) => (repo.stargazers_count > best.stargazers_count ? repo : best),
    repos[0]
  );

  return { name: top.name || 'N/A', stars: top.stargazers_count || 0 };
};

/**
 * Calculate total stars across all repositories.
 * @param {Array<Object>} repos
 * @returns {number}
 */
const getTotalStars = (repos) =>
  repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);

/**
 * Calculate total forks across all repositories.
 * @param {Array<Object>} repos
 * @returns {number}
 */
const getTotalForks = (repos) =>
  repos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0);

/**
 * Calculate account age in years from the creation date.
 * @param {string} createdAt - ISO 8601 date string.
 * @returns {number} Age in years (rounded to 1 decimal).
 */
const getAccountAgeYears = (createdAt) => {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now - created;
  return Math.round((diffMs / (1000 * 60 * 60 * 24 * 365.25)) * 10) / 10;
};

/**
 * Generate a human-readable analysis summary.
 * @param {Object} params
 * @param {string} params.name - Display name or username.
 * @param {number} params.publicRepos
 * @param {number} params.followers
 * @param {number} params.following
 * @param {number} params.totalStars
 * @param {number} params.totalForks
 * @param {Array} params.topLanguages - Top languages array.
 * @param {number} params.score
 * @param {number} params.accountAgeYears
 * @returns {string} Human-readable summary paragraph.
 */
const generateSummary = ({
  name,
  publicRepos,
  followers,
  following,
  totalStars,
  totalForks,
  topLanguages,
  score,
  accountAgeYears,
}) => {
  const displayName = name || 'This developer';

  // Engagement level based on score
  let engagementLevel;
  if (score >= 80) engagementLevel = 'an exceptionally active and influential';
  else if (score >= 60) engagementLevel = 'a highly active';
  else if (score >= 40) engagementLevel = 'an active';
  else if (score >= 20) engagementLevel = 'a moderately active';
  else engagementLevel = 'a budding';

  // Language sentence
  let languageSentence = '';
  if (topLanguages && topLanguages.length > 0) {
    const langs = topLanguages.map((l) => l.language);
    if (langs.length === 1) {
      languageSentence = `${langs[0]} dominates their repositories.`;
    } else if (langs.length === 2) {
      languageSentence = `${langs[0]} and ${langs[1]} dominate their repositories.`;
    } else {
      const last = langs.pop();
      languageSentence = `${langs.join(', ')}, and ${last} are the primary languages across their repositories.`;
    }
  }

  // Engagement ratio
  const engagementRatio = following > 0 ? (followers / following).toFixed(2) : followers;
  let engagementNote = '';
  if (engagementRatio >= 10) {
    engagementNote = `With a follower-to-following ratio of ${engagementRatio}, they have strong community influence.`;
  } else if (engagementRatio >= 2) {
    engagementNote = `They maintain a healthy follower-to-following ratio of ${engagementRatio}.`;
  }

  // Compose summary
  const parts = [
    `${displayName} is ${engagementLevel} GitHub contributor with ${publicRepos} public repositories and ${followers} followers.`,
    languageSentence,
    `Their projects have accumulated ${totalStars} stars and ${totalForks} forks.`,
    engagementNote,
    `The account has been active for approximately ${accountAgeYears} years, earning an analysis score of ${score}/100.`,
  ];

  return parts.filter(Boolean).join(' ');
};

export {
  calculateScore,
  getTopLanguages,
  getMostStarredRepo,
  getTotalStars,
  getTotalForks,
  getAccountAgeYears,
  generateSummary,
};
