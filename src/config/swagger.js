/**
 * Swagger/OpenAPI Configuration
 *
 * Configures swagger-jsdoc to generate API documentation
 * from the swagger.yaml definition file.
 */

import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import yaml from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load and parse the Swagger YAML definition file.
 * @returns {Object} Parsed Swagger specification object.
 */
const loadSwaggerDocument = () => {
  const swaggerPath = join(__dirname, '..', 'docs', 'swagger.yaml');
  const fileContent = fs.readFileSync(swaggerPath, 'utf8');
  return yaml.parse(fileContent);
};

/**
 * Set up Swagger UI middleware on the given Express app.
 * @param {import('express').Application} app - Express application instance.
 */
const setupSwagger = (app) => {
  try {
    const swaggerDocument = loadSwaggerDocument();

    // Override the server URL based on environment
    const port = process.env.PORT || 5000;
    swaggerDocument.servers = [
      { url: `http://localhost:${port}`, description: 'Local Development' },
    ];

    app.use(
      '/api-docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerDocument, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'GitHub Profile Analyzer API Docs',
      })
    );

    console.log(`📚 Swagger docs available at /api-docs`);
  } catch (error) {
    console.error('⚠️  Failed to load Swagger docs:', error.message);
  }
};

export { setupSwagger };
