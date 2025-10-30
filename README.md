# Dictionary Management Platform

An end-to-end word management solution built around a MySQL schema, an Express REST API, and a Vite + React administrative frontend. The repository ships with the **English.sql** dataset so you can bootstrap a working dictionary in a few minutes.

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Repository Layout](#repository-layout)
- [Database Setup](#database-setup)
- [Backend (Express API)](#backend-express-api)
  - [Environment variables](#environment-variables)
  - [Install & run](#install--run)
  - [API endpoints](#api-endpoints)
  - [Optional data workflows](#optional-data-workflows)
- [Frontend (Vite + React)](#frontend-vite--react)
  - [Client environment variables](#client-environment-variables)
  - [Client scripts](#client-scripts)
  - [Feature highlights](#feature-highlights)
- [Concurrent development workflow](#concurrent-development-workflow)
- [Build & deployment](#build--deployment)
- [Troubleshooting](#troubleshooting)
- [Next steps](#next-steps)

## Overview
- **Backend**: Node.js 18+, Express 4, MySQL2 connection pool, request validation via `express-validator`, and structured JSON error handling.
- **Database**: `English.sql` provides schema and seed data for `dictionaries`, `words`, and `dictionary_words` tables with indexes for high-volume lookups.
- **Frontend**: React 19 + Tailwind UI delivered by Vite. The UI covers dictionary CRUD, detail view summaries, and scaffolding for word-level management.

The application is designed so that a new contributor can clone the repo, configure environment variables, import the SQL dump, and start extending either layer independently.

## Prerequisites
Ensure the following tooling is installed locally or available in your container:

- **Node.js** v18 or higher (includes `npm`).
- **MySQL** v8 (or fully compatible distribution such as MariaDB 10.6+).
- **MySQL client** (`mysql` CLI, MySQL Workbench, DBeaver, etc.) for importing/exporting data.
- Optional: modern web browser for the React client and an API client (curl, HTTPie, Postman) for manual testing.

## Repository Layout
```
/home/engine/project
├── app.js                 # Express application bootstrapping routes & middleware
├── server.js              # Backend entry point (loads .env and starts HTTP server)
├── config/                # Database pool configuration
├── controllers/           # REST handlers for dictionaries, words, and associations
├── middleware/            # Validation and error helpers
├── routes/                # Express routers mounted under /api
├── utils/                 # Reusable helpers (AppError, etc.)
├── English.sql            # Schema + seed data for dictionaries & words
└── client/                # Vite + React single-page app
```

## Database Setup
1. **Create an empty database** (use a name that matches your `.env` later):
   ```sql
   CREATE DATABASE dictionary_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **Import the bundled schema and data** from the project root:
   ```bash
   mysql -u <user> -p dictionary_db < English.sql
   ```
   Replace `<user>` and `dictionary_db` with your MySQL username and the database you just created. The dump contains table definitions, indexes, and sample content so the UI has data right away.

> **Tip:** Need to start from scratch? Drop and re-import the database at any time:
> ```bash
> mysql -u <user> -p -e "DROP DATABASE IF EXISTS dictionary_db; CREATE DATABASE dictionary_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
> mysql -u <user> -p dictionary_db < English.sql
> ```

## Backend (Express API)
The backend lives at the repository root and exposes RESTful endpoints under `/api`.

### Environment variables
Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | Port for the Express server. |
| `DB_HOST` | Yes | `localhost` | MySQL host. |
| `DB_PORT` | No | `3306` | MySQL TCP port. |
| `DB_USER` | Yes | `root` | MySQL username with access to the target schema. |
| `DB_PASSWORD` | Yes | _(empty)_ | Password for the MySQL user. |
| `DB_NAME` | Yes | `english` (fallback) | Database name containing the dictionary tables. `.env.example` suggests `dictionary_db`; ensure it matches the schema you created. |
| `DB_POOL_LIMIT` | No | `10` | Maximum concurrent connections in the pool. Useful when tuning for production load. |

> The backend loads environment variables via `dotenv` when `server.js` starts.

### Install & run
From the repository root:

```bash
# Install dependencies
npm install

# Start the API with live reload (nodemon)
npm run dev

# Production-style start (no auto reload)
npm start
```

When running locally the API will be available at `http://localhost:3000/api`. You can verify the service with:
```bash
curl http://localhost:3000/api/dictionaries
```

### API endpoints
Key resources exposed by the service:

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/dictionaries` | List all dictionaries (newest first). |
| `POST` | `/api/dictionaries` | Create a dictionary (name required, booleans for `isEnabled`/`isMastered`). |
| `GET` | `/api/dictionaries/:id` | Retrieve a single dictionary by ID. |
| `PUT` | `/api/dictionaries/:id` | Update name/description/status flags. |
| `DELETE` | `/api/dictionaries/:id` | Remove a dictionary (and its associations via DB constraints). |
| `GET` | `/api/words` | Paginated list of words with optional `search`, `difficulty`, and `masteryStatus` filters. |
| `POST` | `/api/words` | Create a word with phonetics, meaning, pronunciations, difficulty, mastery flag, and notes. |
| `GET` | `/api/words/:id` | Fetch a single word. |
| `PUT` | `/api/words/:id` | Update any subset of word fields. |
| `DELETE` | `/api/words/:id` | Delete a word. |
| `GET` | `/api/dictionary-words` | List associations with optional `dictionaryId` / `wordId` filters. |
| `POST` | `/api/dictionary-words` | Link a word to a dictionary (with optional per-association difficulty, mastery, and notes). |
| `DELETE` | `/api/dictionary-words/:id` | Remove a dictionary-word association. |

#### Sample requests
Create a dictionary:
```bash
curl -X POST http://localhost:3000/api/dictionaries \
  -H "Content-Type: application/json" \
  -d '{
        "name": "Beginner Verbs",
        "description": "High-frequency verbs for weekly drills",
        "isEnabled": true,
        "isMastered": false
      }'
```
Response:
```json
{
  "success": true,
  "data": {
    "id": 7,
    "name": "Beginner Verbs",
    "description": "High-frequency verbs for weekly drills",
    "isEnabled": true,
    "isMastered": false,
    "createdAt": "2024-10-30T12:34:56.000Z",
    "updatedAt": "2024-10-30T12:34:56.000Z"
  }
}
```

Retrieve filtered words:
```bash
curl "http://localhost:3000/api/words?search=listen&difficulty=easy&masteryStatus=false"
```
Response (truncated):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 91,
        "word": "listen",
        "phonetic": "ˈlɪs.ən",
        "meaning": "to give attention to sound",
        "difficulty": 0,
        "isMastered": false,
        "createdAt": "2024-09-01T08:00:00.000Z"
      }
    ],
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

Associate an existing word with a dictionary:
```bash
curl -X POST http://localhost:3000/api/dictionary-words \
  -H "Content-Type: application/json" \
  -d '{
        "dictionaryId": 2,
        "wordId": 91,
        "difficulty": 1,
        "isMastered": false,
        "notes": "Introduced in week 4 drills"
      }'
```

Error responses follow a consistent envelope such as:
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "details": [
    {
      "field": "name",
      "location": "body",
      "message": "Name is required."
    }
  ]
}
```
Use these fields in your client for localized or structured error messages.

### Optional data workflows
- **Bulk import**: Using `English.sql` is the quickest way to populate the schema. For subsequent imports, run the `mysql` command shown above or integrate your own ETL scripts against the same table structure.
- **Data export**: Create portable snapshots for sharing or backups via `mysqldump`:
  ```bash
  mysqldump -u <user> -p dictionary_db dictionaries words dictionary_words > export.sql
  ```
- **Stats & analytics**: Association records include per-dictionary `difficulty`, `isMastered`, and `notes`. Aggregate these fields (e.g., `COUNT(*)`, `AVG(is_mastered)`) to drive dashboard widgets. The React detail page already displays status badges and will surface richer statistics once word associations are added.

## Frontend (Vite + React)
The single-page app lives in `./client` and consumes the REST API.

### Client environment variables
```bash
cd client
cp .env.example .env
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | Yes | `http://localhost:3000` | Base URL for the backend. Append `/api` inside API helpers. Adjust when deploying behind proxies or HTTPS. |

### Client scripts
Install dependencies and run the development server:
```bash
npm install
npm run dev
```

Available npm scripts:

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite in development mode (defaults to `http://localhost:5173`). |
| `npm run build` | Type-check (via `tsc -b`) and generate the production bundle in `dist/`. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint with the project configuration. |

### Feature highlights
- **Dictionary dashboard**: List, create, edit, and delete dictionaries with inline modals and optimistic UI updates.
- **Detail view**: Displays status badges, metadata, and a stats tile designed to surface per-dictionary insights (e.g., mastered vs. in-progress counts).
- **Word management scaffold**: The "Words" page is wired for future API-backed listings; connect it to `/api/words` to enable global search, difficulty filtering, and mastery tracking.
- **Toast feedback**: Success and failure states are surfaced via `react-hot-toast` to keep operators informed.

## Concurrent development workflow
Run the backend and frontend side by side with two terminals:

```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

- Backend defaults to `http://localhost:3000`. Nodemon reloads automatically on file edits.
- Frontend defaults to `http://localhost:5173` and proxies API requests to the URL defined by `VITE_API_BASE_URL`.
- Update the client `.env` if the API runs on a different host/port.

## Build & deployment
- **Backend**
  - Install production dependencies (`npm ci --omit=dev` recommended in CI/CD).
  - Ensure environment variables are populated on the host.
  - Start the service with `npm start` (runs `node server.js`). Use a process manager such as PM2 or systemd for long-running deployments.

- **Frontend**
  - From `client/`, run `npm run build` to create the optimized bundle in `client/dist`.
  - Serve the static output via any HTTP server (Vite preview, Nginx, Netlify, etc.). Ensure the server rewrites unknown routes to `index.html` for SPA routing.

- **Co-deployment**: You can host the static bundle behind the Express API by copying `client/dist` into a static directory and mounting `express.static`, or deploy the frontend separately and point it to the public API base URL via environment configuration.

## Troubleshooting
| Symptom | Possible cause | Resolution |
|---------|----------------|------------|
| `ECONNREFUSED` / `PROTOCOL_CONNECTION_LOST` when the API starts | MySQL not running or wrong host/port. | Verify the MySQL service status, confirm `DB_HOST` and `DB_PORT`, and test with `mysql -h <host> -P <port> -u <user> -p`. |
| `ER_ACCESS_DENIED_ERROR` | Incorrect MySQL credentials. | Update `DB_USER`/`DB_PASSWORD` in `.env`, or grant privileges with `GRANT ALL ON dictionary_db.* TO 'user'@'localhost';`. |
| `ER_BAD_DB_ERROR` | Schema name mismatch. | Ensure the database created during import matches `DB_NAME`. |
| `ER_DUP_ENTRY` responses | Creating duplicate dictionary/word or association. | Use unique names or catch the 409 response in the UI to prompt the user. |
| Frontend cannot reach the API | CORS or wrong base URL. | Confirm `VITE_API_BASE_URL` matches the backend origin, and ensure the backend is reachable from the browser. |
| Ports already in use | Another service running on 3000/5173. | Stop the conflicting service or override `PORT` / `--port` for Vite (`npm run dev -- --port 5174`). |

## Next steps
- Extend the `/api/dictionary-words` routes to calculate word counts per dictionary and surface them in the UI stats tiles.
- Build import/export flows in the UI by wrapping the SQL helpers provided above.
- Connect the "Words" page to the existing `/api/words` endpoints for full CRUD coverage.

With the database in place and both services running, you can manage dictionaries immediately and iterate on new features with confidence.
