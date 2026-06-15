# HireMe Backend

A high-performance REST API built with Fastify and TypeScript for managing recruitment workflows. Handles candidate application submission, secure file storage, and recruiter authentication with a PostgreSQL database powered by Supabase.

## Core Functionality

### Public Endpoints
- **Application Submission**: Accept candidate profiles with PDF resume uploads
- **File Validation**: Enforce PDF-only format and 5MB size limit
- **Multipart Form Handling**: Native support for file uploads with form data
- **Resume Storage**: Secure storage in Supabase with signed URL generation

### Protected Endpoints (Authenticated)
- **Candidate Listing**: Retrieve all applications with pagination support
- **Candidate Details**: Fetch complete profile including resume URL
- **Status Updates**: Change application status through the evaluation pipeline
- **Session Management**: Cookie-based authentication with 8-hour expiration

## Technology Stack

- **Framework**: Fastify v4
- **Language**: TypeScript (strict mode)
- **Database**: Supabase PostgreSQL 15+
- **Storage**: Supabase Storage (private bucket)
- **Authentication**: Cookie-based sessions (@fastify/session)
- **Testing**: Node.js native `node:test` module
- **Password Hashing**: bcryptjs

## Installation

### Prerequisites
- Node.js ≥ 20 LTS
- npm or yarn
- Supabase project with PostgreSQL database

### Setup

1. **Clone and navigate to the backend directory:**
   ```bash
   cd hireme-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Supabase:**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Run the database schema from [../Docs/dataModel.md](../Docs/dataModel.md) in the SQL Editor
   - Create a private storage bucket named `resumes`
   - Copy **Project URL** and **Service Role Key** from Settings → API

4. **Configure environment variables:**
   ```bash
   cp config/.env.example config/.env
   ```
   Then edit `config/.env`:
   ```
   NODE_ENV=development
   PORT=8080
   HOST=0.0.0.0
   
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   
   SESSION_SECRET=a-very-long-random-string-min-32-chars
   DEFAULT_ADMIN_PASSWORD=changeme
   
   SUPABASE_RESUMES_BUCKET=resumes
   RESUME_SIGNED_URL_EXPIRES_IN=3600
   ```

5. **Seed admin user (one-time setup):**
   ```bash
   npx tsx scripts/seed-admin.ts
   ```
   This creates initial admin credentials with bcrypt hashing.

6. **Start the development server:**
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:8080`

## Available Scripts

### `npm run dev`
Starts the development server with auto-reload on file changes using `tsx watch`.

```bash
npm run dev
```
The server will restart automatically when you modify TypeScript files.

### `npm run build`
Compiles TypeScript to JavaScript and outputs to `dist/` directory.

```bash
npm run build
```

### `npm run start`
Runs the compiled production build.

```bash
npm run start
```
Requires `npm run build` to be executed first.

### `npm run test`
Runs all tests using Node.js native test runner with Fastify injection (no HTTP calls needed).

```bash
npm run test
```

### `npm run lint`
Checks code for style and correctness issues with ESLint.

```bash
npm run lint
```

### `npm run format`
Automatically formats code using Prettier.

```bash
npm run format
```

## Project Structure

```
src/
├── server.ts                    # Entry point
├── app.ts                       # Fastify factory & plugin registration
├── db/
│   └── schema.sql               # Database schema (for reference)
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.routes.ts
│   │   ├── auth.schema.ts
│   │   └── auth.test.ts
│   └── applications/
│       ├── applications.controller.ts
│       ├── applications.service.ts
│       ├── applications.routes.ts
│       ├── applications.schema.ts
│       └── applications.test.ts
├── plugins/
│   ├── supabase.ts              # Supabase client decorator
│   ├── session.ts               # Cookie session management
│   ├── cors.ts                  # CORS configuration
│   ├── multipart.ts             # File upload handling
│   ├── cookie.ts                # Cookie parser
│   └── sensible.ts              # Sensible defaults
├── shared/
│   ├── types.ts                 # Shared TypeScript types
│   └── hooks.ts                 # Reusable middleware (requireAuth)
config/
├── env.ts                       # Environment variable loader
├── .env.example                 # Template for environment variables
└── .env                         # Local secrets (git-ignored)
scripts/
└── seed-admin.ts                # Admin user seeding utility
```

## API Endpoints

### Authentication

**POST /v1/auth/login**
- Request: `{ email: string, password: string }`
- Response: `{ message: string }`
- Sets cookie-based session

**POST /v1/auth/logout**
- Response: `{ message: string }`
- Clears session

### Applications (Public)

**POST /v1/applications**
- Multipart form submission with text fields and PDF file
- Fields: `full_name`, `email`, `phone`, `age`, `country`, `city`, `english_level`, `resume`
- Response: `{ message: string, application: Application }`
- Status: `201 Created`

### Applications (Protected - Admin)

**GET /v1/admin/applications**
- Lists all applications (requires authentication)
- Response: `Application[]`

**GET /v1/admin/applications/:id**
- Fetch single application with resume URL (requires authentication)
- Response: `Application`

**PATCH /v1/admin/applications/:id/status**
- Update application status (In Review → Accepted/Rejected)
- Request: `{ status: "In Review" | "Accepted" | "Rejected" }`
- Response: `Application`

## Development Workflow

### Running Backend + Frontend
```bash
# Terminal 1: Backend
cd hireme-backend
npm run dev
# Server runs at http://localhost:8080

# Terminal 2: Frontend
cd hireme-frontend
npm run dev
# UI runs at http://localhost:5173
```

### Testing
```bash
# Run all tests
npm run test

# Tests cover:
# - Input validation (400 errors)
# - Authentication guards (401 errors)
# - Happy path scenarios
# - API error states
```

### Code Quality
```bash
# Check for linting issues
npm run lint

# Auto-format code
npm run format
```

## Database Schema

The database is managed in Supabase with the following key tables:

### `applications`
- `id` (UUID, primary key)
- `full_name`, `email`, `phone`, `age`, `country`, `city`, `english_level`
- `resume_storage_path` (Supabase Storage path)
- `status` (In Review, Accepted, Rejected)
- `created_at`, `updated_at`

### `recruiting_users`
- `id` (UUID, primary key)
- `email` (unique)
- `password_hash` (bcrypt)
- `created_at`, `updated_at`

See [../Docs/dataModel.md](../Docs/dataModel.md) for complete schema.

## Environment Configuration

All environment variables are validated at startup in `config/env.ts`. Missing required variables will throw an error and prevent the server from starting.

### Required Variables
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key for server-side operations
- `SESSION_SECRET` — Random string (min 32 chars) for session encryption
- `DEFAULT_ADMIN_PASSWORD` — Initial admin password for seed script

### Optional Variables
- `NODE_ENV` — `development` or `production` (default: `development`)
- `PORT` — Server port (default: `8080`)
- `HOST` — Bind address (default: `0.0.0.0`)
- `SUPABASE_RESUMES_BUCKET` — Storage bucket name (default: `resumes`)
- `RESUME_SIGNED_URL_EXPIRES_IN` — URL expiration in seconds (default: `3600`)

## Deployment

### Production Build
```bash
npm run build
npm run start
```

### Docker (Example)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json .
RUN npm ci --only=production
COPY dist .
CMD ["node", "dist/src/server.js"]
```

### Environment Setup
Before deployment, ensure `.env` contains production values:
```
NODE_ENV=production
PORT=8080
SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-prod-key
SESSION_SECRET=a-very-long-random-prod-secret
```

## Error Handling

All errors are normalized to JSON format:
```json
{ "error": "Human-readable error message" }
```

HTTP Status Codes:
- `201` — Resource created successfully
- `200` — Request successful
- `400` — Validation error (missing/invalid fields)
- `401` — Unauthorized (missing/invalid session)
- `404` — Resource not found
- `500` — Internal server error

## Contributing

- Maintain TypeScript `strict: true` mode
- Run tests before submitting changes
- Use ESLint and Prettier for code style
- Follow the modular structure (schema → service → controller → routes)
- Write tests alongside implementation
