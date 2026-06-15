# HireMe — Recruitment Application Platform

A modern, two-sided recruitment web application where candidates submit profiles and CVs, while recruiters review applications and manage candidate pipelines through a secure dashboard.

## Overview

HireMe is built as two independently deployable applications:
- **Backend API** — REST API built with Fastify, TypeScript, and Supabase
- **Frontend SPA** — React-based single-page application with TypeScript and Vite

## Project Structure

```
recruitmentWA/
├── hireme-backend/          # REST API server
│   └── README.md            # Backend setup & development guide
├── hireme-frontend/         # React SPA
│   └── README.md            # Frontend setup & development guide
└── Docs/                    # Project specification & documentation
    ├── implementationPlan.md # Master implementation guide
    ├── vision.md            # Product vision & scope
    ├── UserStories.md       # Gherkin acceptance criteria
    ├── dataModel.md         # Database schema & DDL
    ├── openApi.yaml         # API contract specification
    ├── backendImplementationDetails.md
    └── frontendImplementationDetails.md
```

## Quick Start

### Backend
```bash
cd hireme-backend
npm install
cp config/.env.example config/.env
# Configure .env with Supabase credentials
npm run dev
```
See [hireme-backend/README.md](hireme-backend/README.md) for detailed setup.

### Frontend
```bash
cd hireme-frontend
npm install
cp config/.env.example config/.env
# Set VITE_API_BASE_URL=http://localhost:8080/v1
npm run dev
```
See [hireme-frontend/README.md](hireme-frontend/README.md) for detailed setup.

## Documentation

The `Docs/` folder contains all technical specifications:

- **[vision.md](Docs/vision.md)** — Product vision, MVP scope, and MoSCoW priorities
- **[UserStories.md](Docs/UserStories.md)** — BDD acceptance criteria in Gherkin syntax
- **[dataModel.md](Docs/dataModel.md)** — Database schema, DDL, and storage architecture
- **[openApi.yaml](Docs/openApi.yaml)** — REST API contract and endpoint specifications
- **[implementationPlan.md](Docs/implementationPlan.md)** — Master specification for AI-assisted development
- **[backendImplementationDetails.md](Docs/backendImplementationDetails.md)** — Backend architecture & scaffolding
- **[frontendImplementationDetails.md](Docs/frontendImplementationDetails.md)** — Frontend architecture & scaffolding

## Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, React Router, React Hook Form, Zod |
| **Backend** | Fastify v4, TypeScript, Node.js ≥20 |
| **Database** | Supabase (PostgreSQL 15+) |
| **Storage** | Supabase Storage (private bucket) |
| **Auth** | Cookie-based sessions (8h expiration) |
| **Testing** | Vitest (frontend), Node.js native test (backend) |

## Development

### Run Both Servers Locally
```bash
# Terminal 1: Backend (port 8080)
cd hireme-backend && npm run dev

# Terminal 2: Frontend (port 5173)
cd hireme-frontend && npm run dev
```

### Access Points
- **Candidate Form** — http://localhost:5173/
- **Admin Login** — http://localhost:5173/admin/login
- **API Base** — http://localhost:8080/v1

## Key Features

### For Candidates
- Submit personal profile with PDF resume
- Real-time form validation
- Success confirmation

### For Recruiters
- Secure email/password authentication
- View candidate applications in a dashboard
- Access detailed profiles with resume preview
- Update candidate status (In Review → Accepted/Rejected)

## Environment Setup

Both projects require `.env` files (git-ignored templates provided as `.env.example`):

**Backend:**
```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SESSION_SECRET=...
DEFAULT_ADMIN_PASSWORD=...
```

**Frontend:**
```
VITE_API_BASE_URL=http://localhost:8080/v1
```

## Testing

```bash
# Backend tests
cd hireme-backend && npm run test

# Frontend tests
cd hireme-frontend && npm run test
```

## Contributing

- Follow TypeScript `strict: true` mode
- Use CSS Modules (frontend) for styling
- Write tests alongside implementation
- Reference specification documents in `Docs/` for requirements
