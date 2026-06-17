/**
 * Profile Repository
 *
 * Data access layer for the `profiles` table.
 * Encapsulates all raw SQL queries, keeping them isolated
 * from business logic (repository pattern).
 */

import { pool } from '../config/db.js';

class ProfileRepository {
  /**
   * Find a profile by GitHub username.
   * @param {string} username
   * @returns {Promise<Object|null>} Profile row or null.
   */
  async findByUsername(username) {
    const [rows] = await pool.execute(
      'SELECT * FROM profiles WHERE username = ?',
      [username]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Insert a new profile record.
   * @param {Object} data - Profile data fields.
   * @returns {Promise<Object>} Insert result with insertId.
   */
  async create(data) {
    const fields = Object.keys(data);
    const placeholders = fields.map(() => '?').join(', ');
    const values = fields.map((f) => {
      const val = data[f];
      // Serialize objects/arrays to JSON strings for JSON columns
      if (typeof val === 'object' && val !== null) {
        return JSON.stringify(val);
      }
      return val;
    });

    const sql = `INSERT INTO profiles (${fields.join(', ')}) VALUES (${placeholders})`;
    const [result] = await pool.execute(sql, values);
    return result;
  }

  /**
   * Update an existing profile by username.
   * @param {string} username
   * @param {Object} data - Fields to update.
   * @returns {Promise<Object>} Update result with affectedRows.
   */
  async updateByUsername(username, data) {
    const fields = Object.keys(data);
    const setClause = fields.map((f) => `${f} = ?`).join(', ');
    const values = fields.map((f) => {
      const val = data[f];
      if (typeof val === 'object' && val !== null) {
        return JSON.stringify(val);
      }
      return val;
    });
    values.push(username);

    const sql = `UPDATE profiles SET ${setClause} WHERE username = ?`;
    const [result] = await pool.execute(sql, values);
    return result;
  }

  /**
   * Upsert (insert or update) a profile.
   * @param {Object} data - Must include `username`.
   * @returns {Promise<{action: string, data: Object}>} action is 'created' or 'updated'.
   */
  async upsert(data) {
    const existing = await this.findByUsername(data.username);

    if (existing) {
      await this.updateByUsername(data.username, data);
      const updated = await this.findByUsername(data.username);
      return { action: 'updated', data: updated };
    }

    await this.create(data);
    const created = await this.findByUsername(data.username);
    return { action: 'created', data: created };
  }

  /**
   * Retrieve all profiles with pagination, sorting, and search.
   * @param {Object} options
   * @param {number} options.page - Current page (1-indexed).
   * @param {number} options.limit - Items per page.
   * @param {string} options.sortBy - Column to sort by.
   * @param {string} options.sortOrder - 'asc' or 'desc'.
   * @param {string} options.search - Search term (matches username, name, location, bio).
   * @returns {Promise<{data: Array, count: number, pagination: Object}>}
   */
  async findAll({ page = 1, limit = 10, sortBy = 'analyzed_at', sortOrder = 'desc', search = '' }) {
    // Whitelist allowed sort columns to prevent SQL injection
    const allowedSortColumns = [
      'id', 'username', 'name', 'followers', 'following', 'public_repos',
      'total_stars', 'total_forks', 'analysis_score', 'analyzed_at', 'updated_at',
    ];

    const safeSort = allowedSortColumns.includes(sortBy) ? sortBy : 'analyzed_at';
    const safeOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params = [];

    if (search) {
      whereClause = `WHERE username LIKE ? OR name LIKE ? OR location LIKE ? OR bio LIKE ?`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Count total matching rows
    const countSql = `SELECT COUNT(*) as total FROM profiles ${whereClause}`;
    const [countRows] = await pool.execute(countSql, params);
    const total = countRows[0].total;

    // Fetch paginated results
    const dataSql = `SELECT * FROM profiles ${whereClause} ORDER BY ${safeSort} ${safeOrder} LIMIT ? OFFSET ?`;
    const dataParams = [...params, String(limit), String(offset)];
    const [rows] = await pool.execute(dataSql, dataParams);

    // Parse JSON fields
    const data = rows.map((row) => this._parseJsonFields(row));

    return {
      data,
      count: total,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Delete a profile by username.
   * @param {string} username
   * @returns {Promise<boolean>} True if a row was deleted.
   */
  async deleteByUsername(username) {
    const [result] = await pool.execute(
      'DELETE FROM profiles WHERE username = ?',
      [username]
    );
    return result.affectedRows > 0;
  }

  /**
   * Return aggregated statistics across all analyzed profiles.
   * @returns {Promise<Object>}
   */
  async getStats() {
    const sql = `
      SELECT
        COUNT(*) AS totalProfiles,
        ROUND(AVG(followers), 2) AS averageFollowers,
        ROUND(AVG(public_repos), 2) AS averageRepos,
        ROUND(AVG(analysis_score), 2) AS averageScore
      FROM profiles
    `;
    const [rows] = await pool.execute(sql);

    // Top 5 developers by score
    const [topDevs] = await pool.execute(
      'SELECT username, name, analysis_score, followers, total_stars FROM profiles ORDER BY analysis_score DESC LIMIT 5'
    );

    return {
      totalProfiles: rows[0].totalProfiles,
      averageFollowers: rows[0].averageFollowers || 0,
      averageRepos: rows[0].averageRepos || 0,
      averageScore: rows[0].averageScore || 0,
      topDevelopers: topDevs,
    };
  }

  /**
   * Return the top 10 developers ordered by analysis_score descending.
   * @returns {Promise<Array>}
   */
  async getLeaderboard() {
    const [rows] = await pool.execute(
      `SELECT id, username, name, avatar_url, profile_url, public_repos,
              followers, total_stars, total_forks, analysis_score, analysis_summary,
              analyzed_at
       FROM profiles
       ORDER BY analysis_score DESC
       LIMIT 10`
    );
    return rows;
  }

  /**
   * Parse top_languages JSON field if it is stored as a string.
   * @param {Object} row
   * @returns {Object}
   */
  _parseJsonFields(row) {
    if (row && row.top_languages && typeof row.top_languages === 'string') {
      try {
        row.top_languages = JSON.parse(row.top_languages);
      } catch {
        // Leave as-is if parsing fails
      }
    }
    return row;
  }
}

export default new ProfileRepository();
