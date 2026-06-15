# Frontend Implementation Details — HireMe MVP

## Stack

| Layer | Technology |
|---|---|
| Language | TypeScript (strict mode) |
| Framework | React 18 |
| Build Tool | Vite 5 |
| Routing | React Router v6 |
| Forms | React Hook Form + Zod (validation) |
| HTTP Client | fetch (native) via typed API client |
| Styling | CSS Modules |
| Testing | Vitest + React Testing Library + jsdom |
| Linting | ESLint + Prettier |

---

## Project Structure

```
hireme-frontend/
├── config/
│   ├── .env                     # Never committed — gitignored
│   ├── .env.example             # Committed template
│   └── env.ts                   # Typed env accessor (imported app-wide)
├── src/
│   ├── main.tsx                 # Vite entry point
│   ├── App.tsx                  # Router setup
│   ├── api/
│   │   ├── client.ts            # Base fetch wrapper (auth headers, error handling)
│   │   ├── applications.ts      # Application API calls
│   │   └── auth.ts              # Auth API calls
│   ├── modules/
│   │   ├── candidate/
│   │   │   ├── ApplicationForm.tsx
│   │   │   ├── ApplicationForm.test.tsx
│   │   │   └── ApplicationForm.module.css
│   │   └── admin/
│   │       ├── LoginPage.tsx
│   │       ├── LoginPage.test.tsx
│   │       ├── LoginPage.module.css
│   │       ├── Dashboard.tsx
│   │       ├── Dashboard.test.tsx
│   │       ├── Dashboard.module.css
│   │       ├── CandidateProfile.tsx
│   │       ├── CandidateProfile.test.tsx
│   │       └── CandidateProfile.module.css
│   ├── shared/
│   │   ├── types.ts             # Mirrors backend shared types
│   │   ├── components/
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   └── hooks/
│   │       └── useAuth.ts
│   └── context/
│       └── AuthContext.tsx
├── public/
├── index.html
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
├── package.json
└── .gitignore
```

---

## Environment Variables

### `config/.env.example`
```dotenv
VITE_API_BASE_URL=http://localhost:8080/v1
```

> **Vite rule:** only variables prefixed with `VITE_` are exposed to the browser bundle.

### `config/env.ts`
```typescript
// Vite replaces import.meta.env at build time.
// This file centralizes access and fails loudly at startup if vars are missing.

function requireEnv(key: string): string {
  const value = import.meta.env[key];
  if (!value) throw new Error(`Missing required env variable: ${key}`);
  return value;
}

export const env = {
  API_BASE_URL: requireEnv('VITE_API_BASE_URL'),
} as const;
```

### Pointing Vite to `config/.env`

In `vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  envDir: path.resolve(__dirname, 'config'), // loads config/.env
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
});
```

---

## `package.json` (key fields)

```json
{
  "name": "hireme-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src --ext .ts,.tsx",
    "format": "prettier --write src"
  },
  "dependencies": {
    "@hookform/resolvers": "^3",
    "react": "^18",
    "react-dom": "^18",
    "react-hook-form": "^7",
    "react-router-dom": "^6",
    "zod": "^3"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6",
    "@testing-library/react": "^15",
    "@testing-library/user-event": "^14",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@vitejs/plugin-react": "^4",
    "@vitest/coverage-v8": "^1",
    "eslint": "^8",
    "jsdom": "^24",
    "prettier": "^3",
    "typescript": "^5",
    "vite": "^5",
    "vitest": "^1"
  }
}
```

---

## `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src", "config/env.ts"],
  "exclude": ["node_modules", "dist"]
}
```

---

## `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  envDir: path.resolve(__dirname, 'config'),
});
```

### `src/test-setup.ts`
```typescript
import '@testing-library/jest-dom';
```

---

## Shared Types — `src/shared/types.ts`

```typescript
export type EnglishLevel =
  | 'Beginner (A1/A2)'
  | 'Intermediate (B1/B2)'
  | 'Advanced (C1)'
  | 'Native / Fluent (C2)';

export type ApplicationStatus = 'In Review' | 'Accepted' | 'Rejected';

export interface Application {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  age: number;
  country: string;
  city: string;
  english_level: EnglishLevel;
  resume_url: string;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
}

export interface ApiError {
  error: string;
}
```

---

## API Client — `src/api/client.ts`

```typescript
import { env } from '../../config/env';

export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.error ?? body.message ?? message;
    } catch {
      // non-JSON error body — keep statusText
    }
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

export function apiGet<T>(path: string): Promise<T> {
  return fetch(`${env.API_BASE_URL}${path}`, {
    credentials: 'include', // send session cookie
  }).then(handleResponse<T>);
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return fetch(`${env.API_BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }).then(handleResponse<T>);
}

export function apiPostForm<T>(path: string, formData: FormData): Promise<T> {
  return fetch(`${env.API_BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    // Do NOT set Content-Type header — browser sets it with correct boundary
    body: formData,
  }).then(handleResponse<T>);
}

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return fetch(`${env.API_BASE_URL}${path}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(handleResponse<T>);
}
```

### `src/api/auth.ts`
```typescript
import { apiPost } from './client';

export const authApi = {
  login: (email: string, password: string) =>
    apiPost<{ message: string }>('/auth/login', { email, password }),

  logout: () => apiPost<{ message: string }>('/auth/logout'),
};
```

### `src/api/applications.ts`
```typescript
import { apiGet, apiPatch, apiPostForm } from './client';
import { Application, ApplicationStatus } from '@/shared/types';

export const applicationsApi = {
  submit: (formData: FormData) =>
    apiPostForm<{ message: string; application: Application }>('/applications', formData),

  list: () => apiGet<Application[]>('/admin/applications'),

  getById: (id: string) => apiGet<Application>(`/admin/applications/${id}`),

  updateStatus: (id: string, status: ApplicationStatus) =>
    apiPatch<Application>(`/admin/applications/${id}/status`, { status }),
};
```

---

## Auth Context — `src/context/AuthContext.tsx`

```typescript
import React, { createContext, useContext, useState, useCallback } from 'react';
import { authApi } from '@/api/auth';

interface AuthContextValue {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Session is managed server-side via cookie.
  // We track auth state in memory only; on hard refresh the user lands on login if cookie expired.
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    await authApi.login(email, password);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
```

### `src/shared/hooks/useAuth.ts`
```typescript
// Re-export for convenience
export { useAuth } from '@/context/AuthContext';
```

---

## Router — `src/App.tsx`

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';
import ApplicationForm from '@/modules/candidate/ApplicationForm';
import LoginPage from '@/modules/admin/LoginPage';
import Dashboard from '@/modules/admin/Dashboard';
import CandidateProfile from '@/modules/admin/CandidateProfile';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<ApplicationForm />} />
          <Route path="/admin/login" element={<LoginPage />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/applications/:id" element={<CandidateProfile />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

### `src/shared/components/ProtectedRoute.tsx`
```typescript
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/admin/login" replace />;
}
```

---

## Candidate Module

### `src/modules/candidate/ApplicationForm.tsx`

```typescript
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { applicationsApi } from '@/api/applications';
import { ApiError } from '@/api/client';
import { EnglishLevel } from '@/shared/types';
import styles from './ApplicationForm.module.css';

const ENGLISH_LEVELS: EnglishLevel[] = [
  'Beginner (A1/A2)',
  'Intermediate (B1/B2)',
  'Advanced (C1)',
  'Native / Fluent (C2)',
];

const MAX_PDF_SIZE = 5 * 1024 * 1024; // 5MB

const schema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(100),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().min(1, 'Phone is required').max(30),
  age: z.coerce.number().int().min(16, 'Must be at least 16').max(100, 'Must be at most 100'),
  country: z.string().min(1, 'Country is required').max(100),
  city: z.string().min(1, 'City is required').max(100),
  english_level: z.enum([
    'Beginner (A1/A2)',
    'Intermediate (B1/B2)',
    'Advanced (C1)',
    'Native / Fluent (C2)',
  ] as const),
  resume: z
    .instanceof(FileList)
    .refine((fl) => fl.length > 0, 'A PDF resume is required')
    .refine((fl) => fl[0]?.type === 'application/pdf', 'Invalid file format. Only PDF files are permitted.')
    .refine((fl) => fl[0]?.size <= MAX_PDF_SIZE, 'File must be smaller than 5MB'),
});

type FormValues = z.infer<typeof schema>;

export default function ApplicationForm() {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const formData = new FormData();
    formData.append('full_name', values.full_name);
    formData.append('email', values.email);
    formData.append('phone', values.phone);
    formData.append('age', String(values.age));
    formData.append('country', values.country);
    formData.append('city', values.city);
    formData.append('english_level', values.english_level);
    formData.append('resume', values.resume[0]);

    try {
      const res = await applicationsApi.submit(formData);
      setSuccessMsg(res.message);
      reset();
    } catch (err) {
      if (err instanceof ApiError) setServerError(err.message);
    }
  }

  if (successMsg) {
    return (
      <div className={styles.successContainer} role="alert">
        <p>{successMsg}</p>
      </div>
    );
  }

  return (
    <main className={styles.container}>
      <h1>Apply Now</h1>
      {serverError && <p className={styles.serverError} role="alert">{serverError}</p>}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>

        <label htmlFor="full_name">Full Name</label>
        <input id="full_name" {...register('full_name')} />
        {errors.full_name && <span className={styles.error}>{errors.full_name.message}</span>}

        <label htmlFor="email">Email</label>
        <input id="email" type="email" {...register('email')} />
        {errors.email && <span className={styles.error}>{errors.email.message}</span>}

        <label htmlFor="phone">Phone</label>
        <input id="phone" {...register('phone')} />
        {errors.phone && <span className={styles.error}>{errors.phone.message}</span>}

        <label htmlFor="age">Age</label>
        <input id="age" type="number" {...register('age')} />
        {errors.age && <span className={styles.error}>{errors.age.message}</span>}

        <label htmlFor="country">Country</label>
        <input id="country" {...register('country')} />
        {errors.country && <span className={styles.error}>{errors.country.message}</span>}

        <label htmlFor="city">City</label>
        <input id="city" {...register('city')} />
        {errors.city && <span className={styles.error}>{errors.city.message}</span>}

        <label htmlFor="english_level">English Level</label>
        <select id="english_level" {...register('english_level')}>
          <option value="">Select level...</option>
          {ENGLISH_LEVELS.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        {errors.english_level && <span className={styles.error}>{errors.english_level.message}</span>}

        <label htmlFor="resume">CV / Resume (PDF only, max 5MB)</label>
        <input id="resume" type="file" accept="application/pdf" {...register('resume')} />
        {errors.resume && <span className={styles.error}>{errors.resume.message as string}</span>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </main>
  );
}
```

### `src/modules/candidate/ApplicationForm.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ApplicationForm from './ApplicationForm';
import * as applicationsApi from '@/api/applications';

vi.mock('@/api/applications');

const mockSubmit = vi.spyOn(applicationsApi.applicationsApi, 'submit');

function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  return async () => {
    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/phone/i), '+123456789');
    await user.type(screen.getByLabelText(/age/i), '28');
    await user.type(screen.getByLabelText(/country/i), 'United States');
    await user.type(screen.getByLabelText(/city/i), 'New York');
    await user.selectOptions(screen.getByLabelText(/english level/i), 'Advanced (C1)');
  };
}

describe('ApplicationForm', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all required fields', () => {
    render(<ApplicationForm />);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/age/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/english level/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cv/i)).toBeInTheDocument();
  });

  it('shows validation error when resume is missing', async () => {
    render(<ApplicationForm />);
    await fillValidForm(user)();
    await user.click(screen.getByRole('button', { name: /submit/i }));
    await waitFor(() =>
      expect(screen.getByText(/pdf resume is required/i)).toBeInTheDocument()
    );
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('shows error when file is not PDF', async () => {
    render(<ApplicationForm />);
    await fillValidForm(user)();
    const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
    await user.upload(screen.getByLabelText(/cv/i), file);
    await user.click(screen.getByRole('button', { name: /submit/i }));
    await waitFor(() =>
      expect(screen.getByText(/only pdf/i)).toBeInTheDocument()
    );
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('shows success message on successful submission', async () => {
    mockSubmit.mockResolvedValueOnce({
      message: 'Application submitted successfully',
      application: {} as any,
    });
    render(<ApplicationForm />);
    await fillValidForm(user)();
    const pdfFile = new File(['%PDF'], 'resume.pdf', { type: 'application/pdf' });
    await user.upload(screen.getByLabelText(/cv/i), pdfFile);
    await user.click(screen.getByRole('button', { name: /submit/i }));
    await waitFor(() =>
      expect(screen.getByText(/application submitted successfully/i)).toBeInTheDocument()
    );
  });
});
```

---

## Admin Module

### `src/modules/admin/LoginPage.tsx`

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/shared/hooks/useAuth';
import { ApiError } from '@/api/client';
import styles from './LoginPage.module.css';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit({ email, password }: FormValues) {
    setServerError(null);
    try {
      await login(email, password);
      navigate('/admin/dashboard');
    } catch (err) {
      if (err instanceof ApiError) setServerError('Invalid email or password');
    }
  }

  return (
    <main className={styles.container}>
      <h1>Recruiter Login</h1>
      {serverError && <p className={styles.error} role="alert">{serverError}</p>}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>

        <label htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="email" {...register('email')} />
        {errors.email && <span className={styles.fieldError}>{errors.email.message}</span>}

        <label htmlFor="password">Password</label>
        <input id="password" type="password" autoComplete="current-password" {...register('password')} />
        {errors.password && <span className={styles.fieldError}>{errors.password.message}</span>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </main>
  );
}
```

### `src/modules/admin/LoginPage.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';
import { AuthContext } from '@/context/AuthContext';
import { ApiError } from '@/api/client';

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderWithAuth(loginFn = mockLogin) {
  return render(
    <AuthContext.Provider value={{ isAuthenticated: false, login: loginFn, logout: vi.fn() }}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('LoginPage', () => {
  const user = userEvent.setup();

  beforeEach(() => vi.clearAllMocks());

  it('renders email and password fields', () => {
    renderWithAuth();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('shows validation errors when submitted empty', async () => {
    renderWithAuth();
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('navigates to dashboard on successful login', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    renderWithAuth();
    await user.type(screen.getByLabelText(/email/i), 'admin@hireme.com');
    await user.type(screen.getByLabelText(/password/i), 'secret');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard'));
  });

  it('shows error on invalid credentials', async () => {
    mockLogin.mockRejectedValueOnce(new ApiError(401, 'Unauthorized'));
    renderWithAuth();
    await user.type(screen.getByLabelText(/email/i), 'wrong@example.com');
    await user.type(screen.getByLabelText(/password/i), 'bad');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() =>
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
    );
  });
});
```

### `src/modules/admin/Dashboard.tsx`

```typescript
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { applicationsApi } from '@/api/applications';
import { useAuth } from '@/shared/hooks/useAuth';
import { Application } from '@/shared/types';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    applicationsApi.list()
      .then(setApplications)
      .catch(() => setError('Failed to load applications'))
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/admin/login');
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <p role="alert">{error}</p>;

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1>Candidate Dashboard</h1>
        <button onClick={handleLogout}>Log out</button>
      </header>

      {applications.length === 0 ? (
        <p>No applications yet.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Country</th>
              <th>English Level</th>
              <th>Status</th>
              <th>Applied</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id}>
                <td>
                  <Link to={`/admin/applications/${app.id}`}>{app.full_name}</Link>
                </td>
                <td>{app.email}</td>
                <td>{app.country}</td>
                <td>{app.english_level}</td>
                <td><StatusBadge status={app.status} /></td>
                <td>{new Date(app.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
```

### `src/modules/admin/Dashboard.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import * as applicationsApi from '@/api/applications';
import { AuthContext } from '@/context/AuthContext';

vi.mock('@/api/applications');

const mockList = vi.spyOn(applicationsApi.applicationsApi, 'list');

function renderDashboard() {
  return render(
    <AuthContext.Provider value={{ isAuthenticated: true, login: vi.fn(), logout: vi.fn() }}>
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('Dashboard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows loading state initially', () => {
    mockList.mockReturnValue(new Promise(() => {}));
    renderDashboard();
    expect(screen.getByRole('status')).toBeInTheDocument(); // LoadingSpinner aria role
  });

  it('shows empty message when no applications', async () => {
    mockList.mockResolvedValueOnce([]);
    renderDashboard();
    await waitFor(() => expect(screen.getByText(/no applications/i)).toBeInTheDocument());
  });

  it('renders candidate rows from API', async () => {
    mockList.mockResolvedValueOnce([
      {
        id: '1', full_name: 'Jane Doe', email: 'jane@example.com',
        country: 'US', city: 'NY', phone: '+1', age: 28,
        english_level: 'Advanced (C1)', status: 'In Review',
        resume_url: 'https://example.com', created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
    renderDashboard();
    await waitFor(() => expect(screen.getByText('Jane Doe')).toBeInTheDocument());
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('shows error when API fails', async () => {
    mockList.mockRejectedValueOnce(new Error('Network Error'));
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/failed to load/i)
    );
  });
});
```

### `src/modules/admin/CandidateProfile.tsx`

```typescript
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { applicationsApi } from '@/api/applications';
import { Application, ApplicationStatus } from '@/shared/types';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import styles from './CandidateProfile.module.css';

const STATUS_OPTIONS: ApplicationStatus[] = ['In Review', 'Accepted', 'Rejected'];

export default function CandidateProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    applicationsApi.getById(id)
      .then(setApplication)
      .catch(() => setError('Application not found'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (!application) return;
    const newStatus = e.target.value as ApplicationStatus;
    setUpdating(true);
    try {
      const updated = await applicationsApi.updateStatus(application.id, newStatus);
      setApplication(updated);
    } catch {
      setError('Failed to update status');
    } finally {
      setUpdating(false);
    }
  }

  if (loading) return <LoadingSpinner />;
  if (error || !application) return <p role="alert">{error ?? 'Not found'}</p>;

  return (
    <main className={styles.container}>
      <button onClick={() => navigate(-1)} className={styles.back}>← Back</button>
      <h1>{application.full_name}</h1>

      <section className={styles.details}>
        <dl>
          <dt>Email</dt><dd>{application.email}</dd>
          <dt>Phone</dt><dd>{application.phone}</dd>
          <dt>Age</dt><dd>{application.age}</dd>
          <dt>Country</dt><dd>{application.country}</dd>
          <dt>City</dt><dd>{application.city}</dd>
          <dt>English Level</dt><dd>{application.english_level}</dd>
          <dt>Applied</dt><dd>{new Date(application.created_at).toLocaleString()}</dd>
        </dl>
      </section>

      <section className={styles.resume}>
        <h2>CV / Resume</h2>
        <a href={application.resume_url} target="_blank" rel="noopener noreferrer">
          Open / Preview PDF
        </a>
      </section>

      <section className={styles.status}>
        <h2>Pipeline Status</h2>
        <StatusBadge status={application.status} />
        <label htmlFor="status-select">Change status:</label>
        <select
          id="status-select"
          value={application.status}
          onChange={handleStatusChange}
          disabled={updating}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {updating && <span>Saving...</span>}
      </section>
    </main>
  );
}
```

### `src/modules/admin/CandidateProfile.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CandidateProfile from './CandidateProfile';
import * as applicationsApi from '@/api/applications';

vi.mock('@/api/applications');

const mockGetById = vi.spyOn(applicationsApi.applicationsApi, 'getById');
const mockUpdateStatus = vi.spyOn(applicationsApi.applicationsApi, 'updateStatus');

const MOCK_APP = {
  id: 'abc-123', full_name: 'Jane Doe', email: 'jane@example.com',
  phone: '+1', age: 28, country: 'US', city: 'NY',
  english_level: 'Advanced (C1)' as const, status: 'In Review' as const,
  resume_url: 'https://example.com/resume.pdf',
  created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
};

function renderProfile(id = 'abc-123') {
  return render(
    <MemoryRouter initialEntries={[`/admin/applications/${id}`]}>
      <Routes>
        <Route path="/admin/applications/:id" element={<CandidateProfile />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('CandidateProfile', () => {
  const user = userEvent.setup();
  beforeEach(() => vi.clearAllMocks());

  it('renders candidate details after load', async () => {
    mockGetById.mockResolvedValueOnce(MOCK_APP);
    renderProfile();
    await waitFor(() => expect(screen.getByText('Jane Doe')).toBeInTheDocument());
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('Advanced (C1)')).toBeInTheDocument();
  });

  it('renders resume link', async () => {
    mockGetById.mockResolvedValueOnce(MOCK_APP);
    renderProfile();
    await waitFor(() => {
      const link = screen.getByRole('link', { name: /open.*pdf/i });
      expect(link).toHaveAttribute('href', MOCK_APP.resume_url);
    });
  });

  it('updates status when dropdown changes', async () => {
    mockGetById.mockResolvedValueOnce(MOCK_APP);
    mockUpdateStatus.mockResolvedValueOnce({ ...MOCK_APP, status: 'Accepted' });
    renderProfile();
    await waitFor(() => screen.getByLabelText(/change status/i));
    await user.selectOptions(screen.getByLabelText(/change status/i), 'Accepted');
    await waitFor(() => expect(mockUpdateStatus).toHaveBeenCalledWith('abc-123', 'Accepted'));
  });

  it('shows error when application not found', async () => {
    mockGetById.mockRejectedValueOnce(new Error('Not found'));
    renderProfile();
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });
});
```

---

## Shared Components

### `src/shared/components/StatusBadge.tsx`
```typescript
import { ApplicationStatus } from '@/shared/types';

const colorMap: Record<ApplicationStatus, string> = {
  'In Review': '#f59e0b',
  'Accepted': '#10b981',
  'Rejected': '#ef4444',
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: '12px',
      background: colorMap[status],
      color: '#fff',
      fontWeight: 600,
      fontSize: '0.85rem',
    }}>
      {status}
    </span>
  );
}
```

### `src/shared/components/LoadingSpinner.tsx`
```typescript
export function LoadingSpinner() {
  return <div role="status" aria-label="Loading...">Loading...</div>;
}
```

---

## Running the Frontend

```bash
# 1. Install deps
npm install

# 2. Copy and fill env
cp config/.env.example config/.env
# Set VITE_API_BASE_URL=http://localhost:8080/v1

# 3. Dev server
npm run dev

# 4. Run tests
npm test

# 5. Coverage
npm run test:coverage

# 6. Production build
npm run build
```
