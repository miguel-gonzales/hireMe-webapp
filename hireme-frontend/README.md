# HireMe Frontend

A modern React-based single-page application (SPA) for managing recruitment workflows. Candidates can submit their profiles and CVs through a public form, while recruiters can review applications and manage candidate pipelines through a protected admin dashboard.

## Core Functionality

### For Candidates
- **Application Submission**: Submit personal information and upload a PDF resume
- **Form Validation**: Real-time validation with clear error messages
- **English Level Selection**: Choose from predefined language proficiency levels
- **Success Confirmation**: Receive immediate feedback after submission

### For Recruiters (Admin)
- **Secure Login**: Email and password authentication
- **Candidate Dashboard**: View all submitted applications in a sortable table
- **Candidate Profiles**: Access detailed information for each applicant
- **Resume Preview**: Download and preview submitted PDF resumes
- **Pipeline Management**: Update candidate status (In Review → Accepted/Rejected)
- **Secure Logout**: End session safely

## Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Routing**: React Router v6
- **Form Handling**: React Hook Form + Zod validation
- **Styling**: CSS Modules
- **Testing**: Vitest

## Installation

### Prerequisites
- Node.js ≥ 20 LTS
- npm or yarn

### Setup

1. **Clone and navigate to the frontend directory:**
   ```bash
   cd hireme-frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp config/.env.example config/.env
   ```
   Then edit `config/.env` and set:
   ```
   VITE_API_BASE_URL=http://localhost:8080/v1
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

## Available Scripts

### `npm run dev`
Starts the Vite development server with hot module replacement (HMR).

```bash
npm run dev
```

### `npm run build`
Compiles TypeScript and builds the production-optimized bundle.

```bash
npm run build
```
Output is placed in the `dist/` directory.

### `npm run preview`
Preview the production build locally (useful before deployment).

```bash
npm run preview
```

### `npm run test`
Runs unit and integration tests using Vitest.

```bash
npm run test
```

## Project Structure

```
src/
├── App.tsx                      # Main router and layout
├── main.tsx                     # Vite entry point
├── api/                         # API client functions
├── modules/
│   ├── candidate/               # Public application form
│   └── admin/                   # Recruiter dashboard & profile pages
├── shared/
│   └── types.ts                 # Shared TypeScript types
└── styles/                      # CSS modules
config/
├── env.ts                       # Environment variable loader
├── .env.example                 # Template for environment variables
└── .env                         # Local secrets (git-ignored)
```

## Development Workflow

1. **Run backend and frontend simultaneously:**
   ```bash
   # Terminal 1: Backend
   cd hireme-backend
   npm run dev

   # Terminal 2: Frontend
   cd hireme-frontend
   npm run dev
   ```

2. **Access the application:**
   - Candidate form: `http://localhost:5173/`
   - Admin login: `http://localhost:5173/admin/login`

3. **Test admin credentials:**
   - Email: (configured during backend setup)
   - Password: (configured during backend setup)

## Deployment

### Production Build
```bash
npm run build
```

This creates an optimized bundle in the `dist/` directory suitable for:
- Static hosting (AWS S3, Netlify, Vercel)
- Docker containerization
- Any standard web server (Nginx, Apache)

### Environment Configuration
Update `config/.env` with production API URL before building:
```
VITE_API_BASE_URL=https://api.example.com/v1
```

## Contributing

- Maintain TypeScript `strict: true` mode
- Use CSS Modules for all styling
- Test components before submitting changes
- Follow the existing project structure
