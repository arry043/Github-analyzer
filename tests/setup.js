/**
 * Test Setup
 *
 * Configures the test environment:
 *   - Sets NODE_ENV to 'test'
 *   - Loads environment variables from .env
 *   - Extends Jest timeout for integration tests
 */

import { jest } from '@jest/globals';

process.env.NODE_ENV = 'test';

import 'dotenv/config';

// Allow longer timeouts for GitHub API calls and DB operations
jest.setTimeout(30000);
