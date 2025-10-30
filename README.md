# Dictionary Management API

This project provides a simple Express-based REST API for managing dictionaries stored in a MySQL database. The SQL schema is located in `English.sql` and defines the `dictionaries`, `words`, and `dictionary_words` tables.

## Getting started

### Prerequisites

- Node.js 18+
- MySQL 8+ (or compatible)

### Installation

```bash
npm install
```

Create a `.env` file in the project root to configure the database connection:

```dotenv
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=changeme
DB_NAME=english
PORT=3000
```

The database defaults match the schema provided in `English.sql`.

### Running the server

```bash
npm run start
```

For development with automatic reloads:

```bash
npm run dev
```

The service exposes a health probe at `GET /health`.

## API Endpoints

All dictionary endpoints are available under the `/api/dictionaries` prefix.

| Method | Endpoint            | Description                     |
|--------|---------------------|---------------------------------|
| GET    | `/api/dictionaries` | List all dictionaries           |
| GET    | `/api/dictionaries/:id` | Fetch a dictionary by ID  |
| POST   | `/api/dictionaries` | Create a new dictionary          |
| PUT    | `/api/dictionaries/:id` | Update an existing dictionary |
| DELETE | `/api/dictionaries/:id` | Remove a dictionary          |

### Request body

`POST` and `PUT` accept JSON payloads containing:

```json
{
  "name": "CET4",
  "description": "College English Test Band 4 vocabulary",
  "isEnabled": true,
  "isMastered": false
}
```

`name` is required when creating a dictionary; other properties are optional. Boolean flags accept `true`/`false`, `1`/`0`, or similar string equivalents.

### Response format

Every endpoint returns JSON with the shape:

```json
{
  "success": true,
  "data": {}
}
```

When an error occurs the response looks like:

```json
{
  "success": false,
  "error": {
    "message": "Dictionary not found"
  }
}
```

## Manual testing

Below are example `curl` commands you can use to verify the CRUD workflow. Replace placeholder values as needed.

```bash
# Create
curl -X POST http://localhost:3000/api/dictionaries \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CET4",
    "description": "College English Test vocabulary",
    "isEnabled": true,
    "isMastered": false
  }'

# List
curl http://localhost:3000/api/dictionaries

# Fetch by ID
curl http://localhost:3000/api/dictionaries/1

# Update
curl -X PUT http://localhost:3000/api/dictionaries/1 \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description",
    "isEnabled": false
  }'

# Delete
curl -X DELETE http://localhost:3000/api/dictionaries/1
```

These operations can also be validated directly against the database:

```sql
SELECT * FROM dictionaries;
```

Running the above query before and after each request allows you to confirm that inserts, updates, and deletions are reflected in MySQL.
