-- =============================================================================
-- GitHub Profile Analyzer — Sample Data
-- =============================================================================
-- Insert sample profiles for development and testing purposes.
--
-- Usage:
--   mysql -u root -p github_profile_analyzer < database/sample-data.sql
-- =============================================================================

USE github_profile_analyzer;

INSERT INTO profiles (
  github_id, username, name, bio, company, location, blog,
  avatar_url, profile_url,
  public_repos, followers, following, public_gists,
  account_created_at, last_github_update,
  repos_analyzed, total_stars, total_forks,
  most_starred_repo, most_starred_repo_stars,
  average_stars_per_repo, average_forks_per_repo,
  top_languages, analysis_score, analysis_summary
) VALUES
(
  1024025, 'torvalds', 'Linus Torvalds',
  'Linux kernel creator', NULL, 'Portland, OR', NULL,
  'https://avatars.githubusercontent.com/u/1024025?v=4',
  'https://github.com/torvalds',
  7, 221000, 0, 0,
  '2011-09-03 00:00:00', '2024-01-15 00:00:00',
  7, 175000, 55000,
  'linux', 175000,
  25000.00, 7857.14,
  '[{"language":"C","count":5,"percentage":"71.4%"},{"language":"Assembly","count":1,"percentage":"14.3%"},{"language":"Makefile","count":1,"percentage":"14.3%"}]',
  98,
  'Linus Torvalds is an exceptionally active and influential GitHub contributor with 7 public repositories and 221000 followers. C, Assembly, and Makefile are the primary languages across their repositories. Their projects have accumulated 175000 stars and 55000 forks. With a follower-to-following ratio of Infinity, they have strong community influence. The account has been active for approximately 14.8 years, earning an analysis score of 98/100.'
),
(
  583231, 'octocat', 'The Octocat',
  'GitHub mascot', '@github', 'San Francisco', 'https://github.blog',
  'https://avatars.githubusercontent.com/u/583231?v=4',
  'https://github.com/octocat',
  8, 14000, 9, 8,
  '2011-01-25 00:00:00', '2024-06-01 00:00:00',
  8, 6200, 2100,
  'Hello-World', 2500,
  775.00, 262.50,
  '[{"language":"Ruby","count":3,"percentage":"37.5%"},{"language":"JavaScript","count":2,"percentage":"25.0%"},{"language":"CSS","count":2,"percentage":"25.0%"},{"language":"HTML","count":1,"percentage":"12.5%"}]',
  72,
  'The Octocat is a highly active GitHub contributor with 8 public repositories and 14000 followers. Ruby, JavaScript, CSS, and HTML are the primary languages across their repositories. Their projects have accumulated 6200 stars and 2100 forks. With a follower-to-following ratio of 1555.56, they have strong community influence. The account has been active for approximately 15.4 years, earning an analysis score of 72/100.'
),
(
  810438, 'mojombo', 'Tom Preston-Werner',
  'GitHub co-founder', '@github', 'San Francisco', 'http://tom.preston-werner.com',
  'https://avatars.githubusercontent.com/u/1?v=4',
  'https://github.com/mojombo',
  66, 23800, 11, 62,
  '2007-10-20 00:00:00', '2024-03-10 00:00:00',
  66, 15000, 4200,
  'jekyll', 49000,
  227.27, 63.64,
  '[{"language":"Ruby","count":30,"percentage":"60.0%"},{"language":"JavaScript","count":8,"percentage":"16.0%"},{"language":"Shell","count":5,"percentage":"10.0%"},{"language":"C","count":4,"percentage":"8.0%"},{"language":"Python","count":3,"percentage":"6.0%"}]',
  85,
  'Tom Preston-Werner is an exceptionally active and influential GitHub contributor with 66 public repositories and 23800 followers. Ruby, JavaScript, Shell, C, and Python are the primary languages across their repositories. Their projects have accumulated 15000 stars and 4200 forks. With a follower-to-following ratio of 2163.64, they have strong community influence. The account has been active for approximately 18.7 years, earning an analysis score of 85/100.'
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  analysis_score = VALUES(analysis_score);
