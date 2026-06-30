# 🔍 GitHub Profile Analyzer API

A **production-ready** backend service that analyzes GitHub user profiles using the GitHub Public API and stores useful insights in a MySQL.

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Folder Structure](#-folder-structure)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [Running Locally](#-running-locally)
- [Testing](#-testing)
- [Swagger Documentation](#-swagger-documentation)
- [API Examples](#-api-examples)
- [Deployment](#-deployment)
- [Postman Collection](#-postman-collection)
- [Database Schema](#-database-schema)
- [Future Improvements](#-future-improvements)
- [Screenshots](#-screenshots)
- [Author](#-author)

---

## 🎯 Project Overview

The GitHub Profile Analyzer API fetches GitHub user profiles, analyzes their repositories and activity, generates insights (scoring, language breakdown, summary), and stores everything in a MySQL database for later retrieval.

Use cases:
- **Developer portfolios** — quantify and compare GitHub presence
- **Recruiter tools** — evaluate candidates based on open-source contributions
- **Leaderboards** — rank developers in a team or community

---

## ✨ Features

| Feature | Description |
|---|---|
| **Profile Analysis** | Fetch and score any GitHub user in one API call |
| **Insight Generation** | Stars, forks, languages, engagement ratio, custom scoring |
| **Upsert Logic** | Re-analyzing a user updates the existing record |
| **Pagination & Search** | Browse all profiles with page/limit/sort/search params |
| **Leaderboard** | Top 10 developers ranked by analysis score |
| **Aggregated Stats** | Average followers, repos, score across all profiles |
| **Swagger UI** | Interactive API documentation at `/api-docs` |
| **Rate Limiting** | 100 requests per 15-minute window |
| **Security Hardened** | Helmet, CORS, compression, morgan logging |
| **Fully Tested** | Jest + Supertest integration and unit tests |
| **Docker Ready** | Production Dockerfile included |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MySQL |
| HTTP Client | Axios |
| Testing | Jest + Supertest |
| Docs | Swagger / OpenAPI 3.0 |
| Security | Helmet, CORS, express-rate-limit |
| Logging | Morgan |
| Env Config | dotenv |
| DB Driver | mysql2 (connection pooling) |

---

## 🏗 Architecture

The project follows a **layered architecture** with the **repository pattern**:
.
```
Request → Routes → Controller → Service → Repository → MySQL
                                  ↓
                          Insight Generator (utils)
                                  ↓
                            GitHub API (Axios)
```

| Layer | Responsibility |
|---|---|
| **Routes** | URL mapping and HTTP method binding |
| **Controller** | Request validation, response formatting |
| **Service** | Business logic, API orchestration |
| **Repository** | Raw SQL queries, data access |
| **Utils** | Scoring algorithm, summary generation |
| **Middleware** | Error handling, 404 fallback, security |

---

## 📁 Folder Structure

```
github-profile-analyzer/
│
├── src/
│   ├── app.js                        # Express app configuration
│   ├── server.js                     # Entry point
│   ├── config/
│   │   ├── db.js                     # MySQL connection pool
│   │   └── swagger.js                # Swagger UI setup
│   ├── controllers/
│   │   └── githubController.js       # Request handlers
│   ├── routes/
│   │   └── githubRoutes.js           # Route definitions
│   ├── services/
│   │   └── githubService.js          # Business logic
│   ├── repositories/
│   │   └── profileRepository.js      # Data access layer
│   ├── middlewares/
│   │   ├── errorHandler.js           # Centralized error handling
│   │   └── notFound.js               # 404 handler
│   ├── utils/
│   │   └── insightGenerator.js       # Scoring & summary engine
│   └── docs/
│       └── swagger.yaml              # OpenAPI 3.0 spec
│
├── database/
│   ├── schema.sql                    # CREATE TABLE statements
│   └── sample-data.sql               # Sample seed data
│
├── tests/
│   ├── github.test.js                # Integration & unit tests
│   └── setup.js                      # Test environment config
│
├── postman/
│   └── GitHub Profile Analyzer.postman_collection.json
│
├── .env.example
├── .gitignore
├── package.json
├── Dockerfile
└── README.md
```

---

## 🚀 Installation

### Prerequisites

- **Node.js** ≥ 18
- **MySQL** ≥ 8.0
- **npm** ≥ 9
- **Git**

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/your-username/github-profile-analyzer.git
cd github-profile-analyzer

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env

# 4. Edit .env with your MySQL credentials and GitHub token
# (see Environment Variables section below)

# 5. Set up the database
mysql -u root -p < database/schema.sql

# 6. (Optional) Load sample data
mysql -u root -p github_profile_analyzer < database/sample-data.sql

# 7. Start the server
npm run dev
```

---

## 🔐 Environment Variables

Create a `.env` file in the project root (use `.env.example` as template):

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Server port |
| `DB_HOST` | `localhost` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_USER` | `root` | MySQL username |
| `DB_PASSWORD` | `password` | MySQL password |
| `DB_NAME` | `github_profile_analyzer` | Database name |
| `GITHUB_TOKEN` | *(optional)* | GitHub Personal Access Token — raises rate limit from 60 to 5000 req/hr |
| `NODE_ENV` | `development` | Environment (`development`, `production`, `test`) |

> **Tip:** Generate a GitHub token at https://github.com/settings/tokens (no scopes required for public data).

---

## 🗄 Database Setup

```bash
# Create the database and table
mysql -u root -p < database/schema.sql

# Optionally seed with sample data
mysql -u root -p github_profile_analyzer < database/sample-data.sql
```

Or run manually in the MySQL client:

```sql
SOURCE /path/to/database/schema.sql;
```

---

## 🏃 Running Locally

```bash
# Development (auto-reload with nodemon)
npm run dev

# Production
npm start
```

The server starts at `http://localhost:5000` (or your configured `PORT`).

Verify it's running:

```bash
curl http://localhost:5000/api/health
```

---

## 🧪 Testing

Tests use **Jest** and **Supertest** with mocked MySQL and GitHub API (no external dependencies needed).

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage
```

The test suite covers:
- ✅ Health check
- ✅ Analyze profile (new + update)
- ✅ Invalid username validation
- ✅ GitHub 404 handling
- ✅ GitHub rate limit handling
- ✅ Profile retrieval (single + paginated)
- ✅ Profile search and sorting
- ✅ Profile deletion
- ✅ Stats endpoint
- ✅ Leaderboard endpoint
- ✅ 404 route fallback
- ✅ Insight generator unit tests

---

## 📚 Swagger Documentation

Interactive API documentation is available at:

```
http://localhost:5000/api-docs
```

The Swagger UI lets you explore and test every endpoint directly from the browser.

---

## 📡 API Examples

### 1. Analyze a Profile

```bash
curl -X POST http://localhost:5000/api/github/analyze/octocat
```

**Response:**
```json
{
  "success": true,
  "message": "Profile analyzed successfully.",
  "data": {
    "id": 1,
    "username": "octocat",
    "name": "The Octocat",
    "analysis_score": 72,
    "total_stars": 6200,
    "followers": 14000,
    "top_languages": [
      { "language": "Ruby", "count": 2, "percentage": "50.0%" }
    ]
  }
}
```

### 2. Get All Profiles (Paginated)

```bash
curl "http://localhost:5000/api/github/profiles?page=1&limit=5&sortBy=followers&sortOrder=desc"
```

### 3. Get Single Profile

```bash
curl http://localhost:5000/api/github/profiles/octocat
```

### 4. Delete a Profile

```bash
curl -X DELETE http://localhost:5000/api/github/profiles/octocat
```

### 5. Aggregated Statistics

```bash
curl http://localhost:5000/api/github/stats
```

### 6. Leaderboard

```bash
curl http://localhost:5000/api/github/leaderboard
```

---

## 🚢 Deployment

### Docker

```bash
# Build the image
docker build -t github-profile-analyzer .

# Run the container (link to your MySQL instance)
docker run -d \
  --name github-analyzer \
  -p 5000:5000 \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=3306 \
  -e DB_USER=root \
  -e DB_PASSWORD=password \
  -e DB_NAME=github_profile_analyzer \
  -e GITHUB_TOKEN=your_token \
  -e NODE_ENV=production \
  github-profile-analyzer
```

### Render

1. Push your code to GitHub.
2. Create a **New Web Service** on [Render](https://render.com).
3. Connect your GitHub repo.
4. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `node src/server.js`
5. Add environment variables in the Render dashboard.
6. Use Render's managed MySQL or connect to an external MySQL database.

### Railway

1. Push your code to GitHub.
2. Create a new project on [Railway](https://railway.app).
3. Add a **MySQL** plugin.
4. Add a **Web Service** from your repo.
5. Railway auto-detects Node.js — set:
   - **Start Command:** `node src/server.js`
6. Add environment variables using Railway's GUI.

---

## 📮 Postman Collection

Import the Postman collection from:

```
postman/GitHub Profile Analyzer.postman_collection.json
```

The collection includes all endpoints with sample requests organized into folders:
- **Health** — Health check
- **Analysis** — Analyze valid and invalid profiles
- **Profiles** — CRUD operations, search, pagination
- **Statistics** — Stats and leaderboard

Update the `baseUrl` variable if your server is running on a different port.

---

## 🗃 Database Schema

### `profiles` Table

| Column | Type | Description |
|---|---|---|
| `id` | INT (PK, auto) | Internal ID |
| `github_id` | BIGINT | GitHub user ID |
| `username` | VARCHAR(255), UNIQUE | GitHub login |
| `name` | VARCHAR(255) | Display name |
| `bio` | TEXT | Profile bio |
| `company` | VARCHAR(255) | Company |
| `location` | VARCHAR(255) | Location |
| `blog` | VARCHAR(500) | Blog URL |
| `avatar_url` | TEXT | Avatar image URL |
| `profile_url` | TEXT | GitHub profile URL |
| `public_repos` | INT | Public repo count |
| `followers` | INT | Follower count |
| `following` | INT | Following count |
| `public_gists` | INT | Public gist count |
| `account_created_at` | DATETIME | Account creation date |
| `last_github_update` | DATETIME | Last profile update on GitHub |
| `repos_analyzed` | INT | Number of repos analyzed |
| `total_stars` | INT | Sum of stars across repos |
| `total_forks` | INT | Sum of forks across repos |
| `most_starred_repo` | VARCHAR(255) | Name of top-starred repo |
| `most_starred_repo_stars` | INT | Stars on top repo |
| `average_stars_per_repo` | DECIMAL(10,2) | Avg stars/repo |
| `average_forks_per_repo` | DECIMAL(10,2) | Avg forks/repo |
| `top_languages` | JSON | Top 5 languages (array) |
| `analysis_score` | INT | Computed score (0–100) |
| `analysis_summary` | TEXT | Human-readable summary |
| `analyzed_at` | TIMESTAMP | First analysis time |
| `updated_at` | TIMESTAMP | Last update time |

---

## 🔮 Future Improvements

- [ ] **Authentication** — JWT-based auth for admin operations
- [ ] **Caching** — Redis cache for GitHub API responses
- [ ] **Webhooks** — Auto-update profiles on push events
- [ ] **Batch Analysis** — Analyze multiple users concurrently
- [ ] **Repository Deep Dive** — Commit frequency, PR activity, issue stats
- [ ] **Frontend Dashboard** — React/Next.js UI with charts and visualizations
- [ ] **CI/CD Pipeline** — GitHub Actions for automated testing and deployment
- [ ] **GraphQL Endpoint** — Alternative API layer for flexible queries
- [ ] **Email Notifications** — Alert when a tracked profile's score changes significantly

---

## 📸 Screenshots

> *Screenshots will be added after deployment.*

| View | Screenshot |
|---|---|
| Swagger UI | `[screenshot placeholder]` |
| Postman Collection | `[screenshot placeholder]` |
| API Response | `[screenshot placeholder]` |

---

## 👤 Author

**Arry**

- GitHub: [@Arry](https://github.com/arry043)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
