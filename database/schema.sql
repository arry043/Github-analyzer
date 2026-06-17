-- =============================================================================
-- GitHub Profile Analyzer — Database Schema
-- =============================================================================
-- Run this script to create the database and profiles table.
--
-- Usage:
--   mysql -u root -p < database/schema.sql
-- =============================================================================

CREATE DATABASE IF NOT EXISTS github_profile_analyzer
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE github_profile_analyzer;

-- Drop existing table if you need a fresh start (comment out in production)
-- DROP TABLE IF EXISTS profiles;

CREATE TABLE IF NOT EXISTS profiles (
  id                      INT             AUTO_INCREMENT PRIMARY KEY,
  github_id               BIGINT          NOT NULL,
  username                VARCHAR(255)    NOT NULL UNIQUE,
  name                    VARCHAR(255)    DEFAULT NULL,
  bio                     TEXT            DEFAULT NULL,
  company                 VARCHAR(255)    DEFAULT NULL,
  location                VARCHAR(255)    DEFAULT NULL,
  blog                    VARCHAR(500)    DEFAULT NULL,
  avatar_url              TEXT            DEFAULT NULL,
  profile_url             TEXT            DEFAULT NULL,
  public_repos            INT             DEFAULT 0,
  followers               INT             DEFAULT 0,
  following               INT             DEFAULT 0,
  public_gists            INT             DEFAULT 0,
  account_created_at      DATETIME        DEFAULT NULL,
  last_github_update      DATETIME        DEFAULT NULL,
  repos_analyzed          INT             DEFAULT 0,
  total_stars             INT             DEFAULT 0,
  total_forks             INT             DEFAULT 0,
  most_starred_repo       VARCHAR(255)    DEFAULT NULL,
  most_starred_repo_stars INT             DEFAULT 0,
  average_stars_per_repo  DECIMAL(10,2)   DEFAULT 0.00,
  average_forks_per_repo  DECIMAL(10,2)   DEFAULT 0.00,
  top_languages           JSON            DEFAULT NULL,
  analysis_score          INT             DEFAULT 0,
  analysis_summary        TEXT            DEFAULT NULL,
  analyzed_at             TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Indexes for common queries
  INDEX idx_analysis_score (analysis_score DESC),
  INDEX idx_followers      (followers DESC),
  INDEX idx_total_stars    (total_stars DESC),
  INDEX idx_analyzed_at    (analyzed_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
