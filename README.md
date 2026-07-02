# Reading Tracker

A full-stack app for tracking books and reading notes. Backend API with Express + PostgreSQL, React frontend with Vite, all containerized with Docker.

## Stack

- **Frontend:** Vite + React (plain JS)
- **Backend:** Node.js + Express, raw SQL via `pg`
- **Database:** PostgreSQL 16
- **Auth:** Session tokens (SHA-256 hashed, stored in DB)
- **Infra:** Docker Compose (db, api, frontend services) with Nginx reverse proxy

## Quick Start

```bash
cp .env.example .env                     # edit PG_PASSWORD
cp backend/.env.example backend/.env      # edit DATABASE_PASSWORD to match
docker compose up --build
```

Open http://localhost:5173. All traffic goes through Nginx on port 5173 which serves the frontend and proxies `/api/` to the backend.

## Project Layout

```
backend/            Express API
  src/              app.js, db.js, auth/, books/, notes/
  test/             node:test + supertest (48 tests)
  schema.sql        DB schema source of truth
frontend/           React SPA
  src/api.js        fetch wrapper + all API calls
  src/components/   Navbar, BookCard, NoteItem, NoteForm
  src/pages/        Login, Register, BookList, BookForm, BookDetail
docker-compose.yml  db + api + frontend
```

## Tests

```bash
cd backend && npm test     # requires docker compose up
```

Each test wraps in a DB transaction that rolls back — no test data persists.

## API

Auth (no token required): `POST /auth/register`, `/auth/login`, `/auth/logout`

Books (token required): standard CRUD at `/books`, supports `?title=&author=&status=&rating=` filters

Notes (token required): nested CRUD at `/books/:bookId/notes`
