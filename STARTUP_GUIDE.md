# GitHub Profile Analyzer API - Startup Guide

Welcome to the **GitHub Profile Analyzer API** project. This document provides step-by-step instructions on setting up, running, and testing the application.

---

## 🛠️ Step 1: Environment Configuration

Before running the application, configure your environment variables:

1. Locate the [.env.example](file:///c:/Users/Arry/Desktop/CODE/Experiments/github-assignment/.env.example) file in the root of the project.
2. Create a new file named `.env` in the same root directory.
3. Copy the contents of `.env.example` into `.env`.
4. Update the values with your local settings.

Here is an example configuration for `.env`:

```env
PORT=5000
NODE_ENV=development

# MySQL Database settings
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_root_password
DB_NAME=github_profile_analyzer

# Optional: Add a GitHub Personal Access Token to increase API limits
# GITHUB_TOKEN=your_github_token
```

---

## 🗄️ Step 2: Database Initialization

This application stores analyzed profile summaries in a MySQL database. Ensure your MySQL server is running, then run the SQL schema file to initialize the database:

```bash
# Log in to MySQL and run the schema setup
mysql -u root -p < database/schema.sql
```

> [!NOTE]
> This will create the database `github_profile_analyzer` (or the name you configured in `.env`) and build the `profiles` table.

---

## 🚀 Step 3: Launching the Application

Start the development server with hot-reload enabled via Nodemon:

```bash
npm run dev
```

If you want to start the server in production mode:

```bash
npm start
```

### 📍 Accessing the API
Once the server is running:
- **Swagger Documentation (UI)**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
- **API Health Check Endpoint**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Base Endpoint**: `http://localhost:5000/api/github`

---

## 🧪 Step 4: Running Tests

The test suite contains unit and integration tests (built with Jest and Supertest). 

### Run all tests
To execute all tests:
```bash
npm test
```

### Run tests with code coverage report
To check code coverage:
```bash
npm run test:coverage
```

> [!TIP]
> The test suite is designed with mocks for the MySQL database pool and Axios (GitHub API requests), meaning you can run `npm test` successfully even without a running MySQL instance or internet connection.
