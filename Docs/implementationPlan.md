# HireMe MVP — Implementation Plan

> **Purpose:** This document is the master specification for AI-assisted development of the HireMe application. Read this first. Delegate technical details to the linked sub-documents.

---

## 1. Project Overview

HireMe is a two-sided recruitment web application:
- **Candidates** submit a profile + PDF CV through a public, stateless form.
- **Recruiter Admins** log in to a protected dashboard to review candidates and move them through a pipeline (`In Review` → `Accepted` / `Rejected`).

The system consists of two independently deployable applications: a **REST API backend** and a **React SPA frontend**.

Source specifications:
- Product vision and MoSCoW scope → `vision.md`
- Behavior-driven acceptance criteria → `UserStories.md`
- Database schema and DDL → `dataModel.md`
- API contract → `openApi.yaml`

---

## 2. Technology Decisions

| Concern | Backend | Frontend |
|---|---|---|
| Language | TypeScript (strict) | TypeScript (strict) |
| Runtime / Build | Node.js ≥ 20 LTS / `tsc` | Vite 5 |
| Framework | Fastify v4 | React 18 |
| Routing | Fastify plugins | React Router v6 |
| Form Handling | Native multipart via `@fastify/multipart` | React Hook Form + Zod |
| Database | Supabase (PostgreSQL 15+) | — |
| File Storage | Supabase Storage (private bucket) | — |
| Auth | Cookie session (`@fastify/session`) | Context + ProtectedRoute |
| Testing | Fastify `inject` + Node.js `node:test` | Vitest + React Testing Library |
| Linting | ESLint + Prettier | ESLint + Prettier |

---

## 3. Repository Layout

Both applications live in separate directories (monorepo or separate repos — developer's choice):

```
hireme/
├── hireme-backend/          # Node + Fastify REST API
│   ├── config/              # .env, env.ts — all env vars live here
│   └── src/
├── hireme-frontend/         # React + Vite SPA
│   ├── config/              # .env, env.ts — all env vars live here
│   └── src/
└── implementationPlan.md    # ← this file
```

**Rule enforced across both projects:** All environment variables are declared and validated in `config/env.ts`. No code outside that file reads `process.env` (backend) or `import.meta.env` (frontend) directly.

---

## 4. Implementation Phases

Work proceeds in the following order. Each phase has a clear completion checkpoint.

---

### Phase 0 — Infrastructure Setup (Do This First)

#### 4.0.1 Supabase Project
1. Create a new Supabase project.
2. Open the **SQL Editor** and run the full DDL script from `dataModel.md` (section 4).
3. Navigate to **Storage → New Bucket**. Name it `resumes`. **Uncheck "Public bucket".**
4. Copy the **Project URL** and **Service Role Key** from *Settings → API*. These go into `config/.env` for the backend.

#### 4.0.2 Admin User Seeding
The DDL seeds two admin rows with placeholder password hashes. After the backend is running, execute the one-time seed script to replace them with real bcrypt hashes:
```bash
npx tsx scripts/seed-admin.ts
```
See `backendImplementationDetails.md` → *Database Setup Steps* for the full script.

#### 4.0.3 Shared `config/.env` Convention
Both projects follow the same pattern:
```
project-root/
└── config/
    ├── .env          # Real secrets — git-ignored
    └── .env.example  # Committed template with placeholder values
```
Never commit `.env`. Always commit `.env.example`.

---

### Phase 1 — Backend (API First)

Full details: **[backendImplementationDetails.md](./backendImplementationDetails.md)**

#### 4.1.1 Project Initialization
```bash
mkdir hireme-backend && cd hireme-backend
npm init -y
npm install fastify @fastify/cookie @fastify/cors @fastify/multipart \
  @fastify/sensible @fastify/session @supabase/supabase-js bcryptjs fastify-plugin
npm install -D typescript tsx ts-node-dev @types/node @types/bcryptjs eslint prettier
npx tsc --init
```
Copy `tsconfig.json` from `backendImplementationDetails.md`.

#### 4.1.2 Scaffold File Structure
Create the directory tree:
```
src/app.ts  src/server.ts  src/plugins/  src/modules/auth/  
src/modules/applications/  src/shared/  src/db/  config/
```

#### 4.1.3 Implement in This Order
1. `config/env.ts` — env loader and validator
2. `src/plugins/` — supabase, session, multipart, cors, sensible decorators
3. `src/app.ts` — Fastify factory (registers all plugins + routes)
4. `src/server.ts` — entry point
5. `src/shared/types.ts` — shared TypeScript interfaces
6. `src/shared/hooks.ts` — `requireAuth` preHandler
7. `src/modules/auth/` — schema → service → controller → routes
8. `src/modules/applications/` — schema → service → controller → routes
9. Global error handler in `src/app.ts`

#### 4.1.4 Testing Strategy
- Use Fastify's native `app.inject()` method — no HTTP server needed.
- Use Node.js built-in `node:test` and `node:assert/strict`.
- Tests live alongside source files as `*.test.ts`.
- Each module has its own test file covering:
  - Input validation rejection (400)
  - Auth guard rejection (401)
  - Not-found handling (404)
  - Happy path (mocked Supabase responses)

Run tests:
```bash
npm test
```

#### 4.1.5 Checkpoint — Backend Complete When:
- [ ] `POST /v1/applications` accepts a multipart form with a PDF and returns `201`
- [ ] `POST /v1/applications` rejects missing CV → `400 "A PDF resume is required"`
- [ ] `POST /v1/applications` rejects non-PDF → `400 "Invalid file format..."`
- [ ] `POST /v1/auth/login` returns session cookie on valid credentials → `200`
- [ ] `POST /v1/auth/login` returns `401` on wrong credentials
- [ ] `GET /v1/admin/applications` returns `401` without session
- [ ] `GET /v1/admin/applications` returns array with valid session
- [ ] `GET /v1/admin/applications/:id` returns single application with `resume_url`
- [ ] `PATCH /v1/admin/applications/:id/status` updates and returns the application
- [ ] All unit tests pass (`npm test`)

---

### Phase 2 — Frontend (SPA)

Full details: **[frontendImplementationDetails.md](./frontendImplementationDetails.md)**

#### 4.2.1 Project Initialization
```bash
npm create vite@latest hireme-frontend -- --template react-ts
cd hireme-frontend
npm install react-hook-form @hookform/resolvers zod react-router-dom
npm install -D vitest @vitest/coverage-v8 @testing-library/react \
  @testing-library/user-event @testing-library/jest-dom jsdom
```

#### 4.2.2 Configure Vite to Load `config/.env`
In `vite.config.ts`, set `envDir: path.resolve(__dirname, 'config')`. See `frontendImplementationDetails.md` → *Vite Config*.

#### 4.2.3 Scaffold File Structure
```
src/api/  src/modules/candidate/  src/modules/admin/  
src/shared/components/  src/shared/hooks/  src/context/  config/
```

#### 4.2.4 Implement in This Order
1. `config/env.ts` — typed `import.meta.env` accessor
2. `src/shared/types.ts` — mirrors backend types
3. `src/api/client.ts` — base fetch wrapper with error handling
4. `src/api/auth.ts` and `src/api/applications.ts` — typed API calls
5. `src/context/AuthContext.tsx` — session state management
6. `src/shared/components/` — `ProtectedRoute`, `StatusBadge`, `LoadingSpinner`
7. `src/App.tsx` — router with public and protected routes
8. `src/modules/candidate/ApplicationForm.tsx` — public form with Zod validation
9. `src/modules/admin/LoginPage.tsx`
10. `src/modules/admin/Dashboard.tsx` — candidate roster table
11. `src/modules/admin/CandidateProfile.tsx` — full profile + status dropdown

#### 4.2.5 Testing Strategy
- Vitest is configured with `jsdom` environment for DOM access.
- React Testing Library with `userEvent` for user interaction simulation.
- All API calls are mocked with `vi.mock()` / `vi.spyOn()`.
- Tests exercise user-visible behavior, not implementation internals.
- Coverage command: `npm run test:coverage`

Key behaviors tested per component:

| Component | Tests |
|---|---|
| `ApplicationForm` | Field rendering, missing CV error, non-PDF error, success message |
| `LoginPage` | Field rendering, empty submit errors, success navigation, invalid credentials error |
| `Dashboard` | Loading state, empty state, row rendering, API error |
| `CandidateProfile` | Details rendering, resume link, status dropdown update, not-found error |

#### 4.2.6 Checkpoint — Frontend Complete When:
- [ ] Candidate can fill and submit the form; sees success message on `201`
- [ ] Candidate sees inline validation error if CV is missing
- [ ] Candidate sees inline validation error if file is not PDF
- [ ] Admin navigates to `/admin/login` and logs in successfully
- [ ] Admin is redirected to `/admin/dashboard` after login
- [ ] Admin sees a table of all candidates
- [ ] Admin clicks a candidate row and sees their full profile
- [ ] Admin can preview/open the PDF via the signed URL link
- [ ] Admin changes status via dropdown; display updates immediately
- [ ] Non-authenticated access to `/admin/*` routes redirects to login
- [ ] All Vitest tests pass (`npm test`)

---

### Phase 3 — Integration & End-to-End Verification

After both checkpoints are met:

1. **Run both servers locally:**
   ```bash
   # Terminal 1
   cd hireme-backend && npm run dev   # http://localhost:8080

   # Terminal 2
   cd hireme-frontend && npm run dev  # http://localhost:5173
   ```

2. **Walk through all Gherkin scenarios** from `UserStories.md` manually:
   - Epic 1: Candidate form submission (success, missing CV, wrong format)
   - Epic 2: Admin dashboard review + status lifecycle transitions

3. **Verify CORS:** The backend `cors` plugin must allow `http://localhost:5173` in development. Set `CORS_ORIGIN=http://localhost:5173` in `config/.env`.

4. **Verify cookie behavior:** The browser must send the session cookie on all `/admin/*` requests. The fetch client uses `credentials: 'include'`. The backend session cookie must have `SameSite=Strict` and `Secure=false` in development.

---

## 5. Cross-Cutting Rules (Both Projects)

### Modularity
- Each feature is a self-contained module: routes / controller / service / schema / tests.
- No module imports from another module's internals. Shared code lives in `src/shared/`.

### Environment Variables
- **Backend:** All declared in `config/env.ts`, read from `config/.env`.
- **Frontend:** All declared in `config/env.ts` (typed `import.meta.env`), read from `config/.env` (Vite `envDir` set to `config/`).
- `.env` is always gitignored. `.env.example` is always committed.

### Testing
- Backend: `node:test` + Fastify `inject` — no additional test runner needed.
- Frontend: Vitest (TypeScript-native) + React Testing Library — no Jest.
- Tests live next to source files (`*.test.ts` / `*.test.tsx`).
- Tests cover: validation errors, authentication guards, happy paths, API error states.

### TypeScript
- `strict: true` in both `tsconfig.json` files.
- No `any` except where unavoidable and explicitly commented.
- Shared types are not cross-imported between projects; each defines its own `src/shared/types.ts` keeping the two deployables independent.

### Error Handling
- Backend: global Fastify error handler normalizes all errors to `{ error: string }`.
- Frontend: `ApiError` class in `src/api/client.ts` wraps all non-2xx responses; components display user-facing messages without leaking internals.

---

## 6. Key Constraints Summary

| Constraint | Detail |
|---|---|
| CV format | PDF only (`application/pdf`) |
| CV max size | 5 MB (enforced by multipart plugin + Zod) |
| Age range | 16–100 (enforced by DB constraint + Zod) |
| English levels | Locked enum: A1/A2, B1/B2, C1, C2 |
| Pipeline states | `In Review` (default), `Accepted`, `Rejected` |
| CV storage | Supabase Storage private bucket `resumes`; only path stored in DB |
| Resume access | Time-limited signed URL generated per request; never stored |
| Admin auth | Cookie session (8h); candidates have no login |
| Candidate deduplication | Same email may submit multiple times (MVP scope) |

---

## 7. File Reference Index

| File | Purpose |
|---|---|
| `implementationPlan.md` | Master plan — this document |
| `backendImplementationDetails.md` | Full backend scaffold: env, plugins, modules, tests, DB setup |
| `frontendImplementationDetails.md` | Full frontend scaffold: env, API client, modules, tests, Vitest config |
| `openApi.yaml` | Authoritative REST API contract |
| `dataModel.md` | Database schema, DDL, storage architecture |
| `UserStories.md` | BDD acceptance criteria (Gherkin) |
| `vision.md` | Product vision, MVP scope, MoSCoW priorities |
