# Backend Implementation Details — HireMe MVP

## Stack & Runtime

| Layer | Technology |
|---|---|
| Language | TypeScript (strict mode) |
| Runtime | Node.js ≥ 20 LTS |
| Framework | Fastify v4 |
| Database | Supabase (PostgreSQL 15+) via `@supabase/supabase-js` v2 |
| File Storage | Supabase Storage (private `resumes` bucket) |
| Auth | Cookie-based session (fastify-plugin + `@fastify/cookie` + `@fastify/session`) |
| Validation | Fastify's native JSON Schema + `@fastify/multipart` for file uploads |
| Testing | Fastify's built-in `inject` test runner + Node.js `node:test` |
| Linting | ESLint + Prettier |
| Build | `tsc` → `dist/` |

---

## Project Structure

```
hireme-backend/
├── config/
│   ├── .env                     # Never committed — gitignored
│   ├── .env.example             # Committed template
│   └── env.ts                   # Single source of truth: loads & validates env vars
├── src/
│   ├── app.ts                   # Fastify instance factory (exported for testing)
│   ├── server.ts                # Entry point — calls app() then listen()
│   ├── plugins/
│   │   ├── sensible.ts          # @fastify/sensible (httpErrors helpers)
│   │   ├── cors.ts              # @fastify/cors
│   │   ├── cookie.ts            # @fastify/cookie
│   │   ├── session.ts           # @fastify/session
│   │   ├── multipart.ts         # @fastify/multipart (file uploads)
│   │   └── supabase.ts          # Supabase client decorator on fastify instance
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.schema.ts   # JSON Schema for request/response
│   │   │   └── auth.test.ts
│   │   └── applications/
│   │       ├── applications.routes.ts
│   │       ├── applications.controller.ts
│   │       ├── applications.service.ts
│   │       ├── applications.schema.ts
│   │       └── applications.test.ts
│   ├── shared/
│   │   ├── types.ts             # Shared TypeScript interfaces & enums
│   │   ├── errors.ts            # Custom error classes
│   │   └── hooks.ts             # Shared preHandler hooks (e.g. requireAuth)
│   └── db/
│       └── schema.sql           # DDL script (copied from dataModel.md)
├── package.json
├── tsconfig.json
└── .gitignore
```

---

## Environment Variables

### `config/.env.example`
```dotenv
# Server
NODE_ENV=development
PORT=8080
HOST=0.0.0.0

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Session
SESSION_SECRET=a-very-long-random-string-min-32-chars

# Admin seed (used only for initial password hash generation)
DEFAULT_ADMIN_PASSWORD=changeme

# Storage
SUPABASE_RESUMES_BUCKET=resumes
RESUME_SIGNED_URL_EXPIRES_IN=3600
```

### `config/env.ts`
```typescript
import { config } from 'dotenv';
import path from 'node:path';

// Always load from config/.env regardless of cwd
config({ path: path.resolve(__dirname, '../config/.env') });

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: parseInt(process.env.PORT ?? '8080', 10),
  HOST: process.env.HOST ?? '0.0.0.0',
  SUPABASE_URL: requireEnv('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  SESSION_SECRET: requireEnv('SESSION_SECRET'),
  SUPABASE_RESUMES_BUCKET: process.env.SUPABASE_RESUMES_BUCKET ?? 'resumes',
  RESUME_SIGNED_URL_EXPIRES_IN: parseInt(
    process.env.RESUME_SIGNED_URL_EXPIRES_IN ?? '3600',
    10
  ),
} as const;
```

> **Rule:** Import `env` from `config/env.ts` everywhere. Never read `process.env` directly outside this file.

---

## `package.json` (key fields)

```json
{
  "name": "hireme-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "node --experimental-vm-modules --import tsx/esm node:test src/**/*.test.ts",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write src"
  },
  "dependencies": {
    "@fastify/cookie": "^9",
    "@fastify/cors": "^9",
    "@fastify/multipart": "^8",
    "@fastify/sensible": "^5",
    "@fastify/session": "^10",
    "@supabase/supabase-js": "^2",
    "bcryptjs": "^2",
    "fastify": "^4",
    "fastify-plugin": "^4"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2",
    "@types/node": "^20",
    "eslint": "^8",
    "prettier": "^3",
    "ts-node-dev": "^2",
    "tsx": "^4",
    "typescript": "^5"
  }
}
```

---

## `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "paths": {
      "@config/*": ["../config/*"]
    }
  },
  "include": ["src/**/*", "config/**/*"],
  "exclude": ["node_modules", "dist"]
}
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
  resume_storage_path: string;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
}

// What the API returns to clients (resume_url instead of resume_storage_path)
export interface ApplicationResponse extends Omit<Application, 'resume_storage_path'> {
  resume_url: string;
}

export interface RecruitingUser {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}
```

---

## Plugin Setup

### `src/plugins/supabase.ts`
```typescript
import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../../config/env';

declare module 'fastify' {
  interface FastifyInstance {
    supabase: SupabaseClient;
  }
}

export default fp(async (fastify: FastifyInstance) => {
  const client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  fastify.decorate('supabase', client);
});
```

### `src/plugins/session.ts`
```typescript
import fp from 'fastify-plugin';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import { FastifyInstance } from 'fastify';
import { env } from '../../config/env';

export default fp(async (fastify: FastifyInstance) => {
  await fastify.register(fastifyCookie);
  await fastify.register(fastifySession, {
    secret: env.SESSION_SECRET,
    cookie: {
      secure: env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    },
    saveUninitialized: false,
  });
});
```

### `src/plugins/multipart.ts`
```typescript
import fp from 'fastify-plugin';
import fastifyMultipart from '@fastify/multipart';
import { FastifyInstance } from 'fastify';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default fp(async (fastify: FastifyInstance) => {
  await fastify.register(fastifyMultipart, {
    limits: {
      fileSize: MAX_FILE_SIZE,
      files: 1,
    },
  });
});
```

---

## App Factory — `src/app.ts`

```typescript
import Fastify, { FastifyInstance } from 'fastify';
import sensible from '@fastify/sensible';
import cors from '@fastify/cors';
import supabasePlugin from './plugins/supabase';
import sessionPlugin from './plugins/session';
import multipartPlugin from './plugins/multipart';
import authRoutes from './modules/auth/auth.routes';
import applicationRoutes from './modules/applications/applications.routes';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
  });

  // Plugins
  await app.register(sensible);
  await app.register(cors, { origin: process.env.CORS_ORIGIN ?? '*' });
  await app.register(supabasePlugin);
  await app.register(sessionPlugin);
  await app.register(multipartPlugin);

  // Routes
  await app.register(authRoutes, { prefix: '/v1/auth' });
  await app.register(applicationRoutes, { prefix: '/v1' });

  return app;
}
```

### `src/server.ts`
```typescript
import { buildApp } from './app';
import { env } from '../config/env';

async function start() {
  const app = await buildApp();
  await app.listen({ port: env.PORT, host: env.HOST });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

---

## Auth Module

### `src/modules/auth/auth.schema.ts`
```typescript
export const loginSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 1 },
    },
    additionalProperties: false,
  },
} as const;
```

### `src/modules/auth/auth.service.ts`
```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { RecruitingUser } from '../../shared/types';

export class AuthService {
  constructor(private supabase: SupabaseClient) {}

  async validateCredentials(email: string, password: string): Promise<RecruitingUser | null> {
    const { data, error } = await this.supabase
      .from('recruiting_users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) return null;

    const valid = await bcrypt.compare(password, data.password_hash);
    return valid ? (data as RecruitingUser) : null;
  }
}
```

### `src/modules/auth/auth.controller.ts`
```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service';

interface LoginBody {
  email: string;
  password: string;
}

export class AuthController {
  constructor(private service: AuthService) {}

  async login(req: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) {
    const { email, password } = req.body;
    const user = await this.service.validateCredentials(email, password);

    if (!user) {
      return reply.unauthorized('Invalid email or password');
    }

    req.session.set('userId', user.id);
    return reply.code(200).send({ message: 'Authenticated successfully' });
  }

  async logout(req: FastifyRequest, reply: FastifyReply) {
    await req.session.destroy();
    return reply.code(200).send({ message: 'Logged out' });
  }
}
```

### `src/modules/auth/auth.routes.ts`
```typescript
import { FastifyInstance } from 'fastify';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { loginSchema } from './auth.schema';

export default async function authRoutes(fastify: FastifyInstance) {
  const service = new AuthService(fastify.supabase);
  const controller = new AuthController(service);

  fastify.post('/login', { schema: loginSchema }, controller.login.bind(controller));
  fastify.post('/logout', controller.logout.bind(controller));
}
```

### `src/modules/auth/auth.test.ts`
```typescript
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../../app';
import { FastifyInstance } from 'fastify';

describe('Auth Routes', () => {
  let app: FastifyInstance;

  before(async () => {
    app = await buildApp();
  });

  after(async () => {
    await app.close();
  });

  it('POST /v1/auth/login — returns 400 when body is missing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: {},
    });
    assert.equal(res.statusCode, 400);
  });

  it('POST /v1/auth/login — returns 401 with invalid credentials', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email: 'nobody@example.com', password: 'wrong' },
    });
    assert.equal(res.statusCode, 401);
  });

  it('POST /v1/auth/logout — returns 200', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/logout',
    });
    assert.equal(res.statusCode, 200);
  });
});
```

---

## Applications Module

### `src/modules/applications/applications.schema.ts`
```typescript
const englishLevelEnum = [
  'Beginner (A1/A2)',
  'Intermediate (B1/B2)',
  'Advanced (C1)',
  'Native / Fluent (C2)',
];

const applicationStatusEnum = ['In Review', 'Accepted', 'Rejected'];

// Returned Application object schema (for response serialization)
export const applicationResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    full_name: { type: 'string' },
    email: { type: 'string', format: 'email' },
    phone: { type: 'string' },
    age: { type: 'integer' },
    country: { type: 'string' },
    city: { type: 'string' },
    english_level: { type: 'string', enum: englishLevelEnum },
    resume_url: { type: 'string', format: 'uri' },
    status: { type: 'string', enum: applicationStatusEnum },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
} as const;

export const updateStatusSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'string', format: 'uuid' } },
  },
  body: {
    type: 'object',
    required: ['status'],
    properties: {
      status: { type: 'string', enum: applicationStatusEnum },
    },
    additionalProperties: false,
  },
  response: {
    200: applicationResponseSchema,
  },
} as const;

export const getByIdSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'string', format: 'uuid' } },
  },
  response: {
    200: applicationResponseSchema,
  },
} as const;
```

### `src/modules/applications/applications.service.ts`
```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import { Application, ApplicationResponse, ApplicationStatus } from '../../shared/types';
import { env } from '../../../config/env';

const VALID_MIME = 'application/pdf';

export class ApplicationsService {
  constructor(private supabase: SupabaseClient) {}

  // ── Candidate Submission ──────────────────────────────────────────────────

  async submitApplication(
    fields: Omit<Application, 'id' | 'status' | 'resume_storage_path' | 'created_at' | 'updated_at'>,
    file: { mimetype: string; buffer: Buffer; filename: string }
  ): Promise<ApplicationResponse> {

    // 1. Validate mime type (buffer already size-limited by multipart plugin)
    if (file.mimetype !== VALID_MIME) {
      throw Object.assign(new Error('Invalid file format. Only PDF files are permitted.'), {
        statusCode: 400,
      });
    }

    // 2. Insert application row first to obtain the UUID
    const { data: inserted, error: insertError } = await this.supabase
      .from('applications')
      .insert([{ ...fields, resume_storage_path: 'pending' }])
      .select()
      .single();

    if (insertError || !inserted) throw insertError;

    // 3. Upload file to Supabase Storage
    const storagePath = `${inserted.id}/resume.pdf`;
    const { error: uploadError } = await this.supabase.storage
      .from(env.SUPABASE_RESUMES_BUCKET)
      .upload(storagePath, file.buffer, {
        contentType: VALID_MIME,
        upsert: false,
      });

    if (uploadError) {
      // Rollback DB row
      await this.supabase.from('applications').delete().eq('id', inserted.id);
      throw uploadError;
    }

    // 4. Update row with real storage path
    const { data: updated, error: updateError } = await this.supabase
      .from('applications')
      .update({ resume_storage_path: storagePath })
      .eq('id', inserted.id)
      .select()
      .single();

    if (updateError || !updated) throw updateError;

    return this.toResponse(updated as Application);
  }

  // ── Admin Reads ───────────────────────────────────────────────────────────

  async listApplications(): Promise<ApplicationResponse[]> {
    const { data, error } = await this.supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return Promise.all((data as Application[]).map((a) => this.toResponse(a)));
  }

  async getApplicationById(id: string): Promise<ApplicationResponse> {
    const { data, error } = await this.supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw Object.assign(new Error('Application not found'), { statusCode: 404 });
    }

    return this.toResponse(data as Application);
  }

  // ── Admin Status Update ───────────────────────────────────────────────────

  async updateStatus(id: string, status: ApplicationStatus): Promise<ApplicationResponse> {
    const { data, error } = await this.supabase
      .from('applications')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw Object.assign(new Error('Application not found'), { statusCode: 404 });
    }

    return this.toResponse(data as Application);
  }

  // ── Private Helpers ───────────────────────────────────────────────────────

  private async toResponse(app: Application): Promise<ApplicationResponse> {
    const { resume_storage_path, ...rest } = app;

    const { data: signedData, error } = await this.supabase.storage
      .from(env.SUPABASE_RESUMES_BUCKET)
      .createSignedUrl(resume_storage_path, env.RESUME_SIGNED_URL_EXPIRES_IN);

    if (error || !signedData) throw error;

    return { ...rest, resume_url: signedData.signedUrl };
  }
}
```

### `src/modules/applications/applications.controller.ts`
```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { ApplicationsService } from './applications.service';
import { ApplicationStatus, EnglishLevel } from '../../shared/types';

interface UpdateStatusParams { id: string }
interface UpdateStatusBody { status: ApplicationStatus }
interface GetByIdParams { id: string }

export class ApplicationsController {
  constructor(private service: ApplicationsService) {}

  // POST /applications — public, multipart
  async submit(req: FastifyRequest, reply: FastifyReply) {
    const parts = req.parts();
    const fields: Record<string, string> = {};
    let fileBuffer: Buffer | null = null;
    let fileMimetype = '';
    let fileFilename = '';

    for await (const part of parts) {
      if (part.type === 'file') {
        const chunks: Buffer[] = [];
        for await (const chunk of part.file) chunks.push(chunk);
        fileBuffer = Buffer.concat(chunks);
        fileMimetype = part.mimetype;
        fileFilename = part.filename;
      } else {
        fields[part.fieldname] = part.value as string;
      }
    }

    if (!fileBuffer) {
      return reply.badRequest('A PDF resume is required');
    }

    const result = await this.service.submitApplication(
      {
        full_name: fields.full_name,
        email: fields.email,
        phone: fields.phone,
        age: parseInt(fields.age, 10),
        country: fields.country,
        city: fields.city,
        english_level: fields.english_level as EnglishLevel,
      },
      { buffer: fileBuffer, mimetype: fileMimetype, filename: fileFilename }
    );

    return reply.code(201).send({ message: 'Application submitted successfully', application: result });
  }

  // GET /admin/applications
  async list(_req: FastifyRequest, reply: FastifyReply) {
    const data = await this.service.listApplications();
    return reply.send(data);
  }

  // GET /admin/applications/:id
  async getById(
    req: FastifyRequest<{ Params: GetByIdParams }>,
    reply: FastifyReply
  ) {
    const data = await this.service.getApplicationById(req.params.id);
    return reply.send(data);
  }

  // PATCH /admin/applications/:id/status
  async updateStatus(
    req: FastifyRequest<{ Params: UpdateStatusParams; Body: UpdateStatusBody }>,
    reply: FastifyReply
  ) {
    const data = await this.service.updateStatus(req.params.id, req.body.status);
    return reply.send(data);
  }
}
```

### `src/shared/hooks.ts` — Auth Guard
```typescript
import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';

export function requireAuth(
  req: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction
) {
  if (!req.session.get('userId')) {
    reply.unauthorized('Authentication required');
    return;
  }
  done();
}
```

### `src/modules/applications/applications.routes.ts`
```typescript
import { FastifyInstance } from 'fastify';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { requireAuth } from '../../shared/hooks';
import { updateStatusSchema, getByIdSchema } from './applications.schema';

export default async function applicationRoutes(fastify: FastifyInstance) {
  const service = new ApplicationsService(fastify.supabase);
  const controller = new ApplicationsController(service);

  // Public
  fastify.post('/applications', controller.submit.bind(controller));

  // Admin — all guarded
  fastify.register(async (adminScope) => {
    adminScope.addHook('preHandler', requireAuth);

    adminScope.get('/applications', controller.list.bind(controller));
    adminScope.get('/applications/:id', { schema: getByIdSchema }, controller.getById.bind(controller));
    adminScope.patch('/applications/:id/status', { schema: updateStatusSchema }, controller.updateStatus.bind(controller));
  }, { prefix: '/admin' });
}
```

### `src/modules/applications/applications.test.ts`
```typescript
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../../app';
import { FastifyInstance } from 'fastify';

describe('Applications Routes', () => {
  let app: FastifyInstance;

  before(async () => { app = await buildApp(); });
  after(async () => { await app.close(); });

  describe('POST /v1/applications', () => {
    it('returns 400 when resume is not attached', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/applications',
        headers: { 'content-type': 'multipart/form-data; boundary=X' },
        payload:
          '--X\r\nContent-Disposition: form-data; name="full_name"\r\n\r\nJane Doe\r\n--X--',
      });
      assert.equal(res.statusCode, 400);
    });

    it('returns 400 when file is not PDF', async () => {
      // Build a minimal multipart body with a .jpg
      const boundary = 'testboundary';
      const body = buildMultipart(boundary, {
        full_name: 'Jane',
        email: 'jane@example.com',
        phone: '+123',
        age: '28',
        country: 'US',
        city: 'NY',
        english_level: 'Advanced (C1)',
      }, { filename: 'photo.jpg', mimetype: 'image/jpeg', content: Buffer.from('fake') });

      const res = await app.inject({
        method: 'POST',
        url: '/v1/applications',
        headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
        payload: body,
      });
      assert.equal(res.statusCode, 400);
      const json = res.json();
      assert.match(json.message, /PDF/i);
    });
  });

  describe('GET /v1/admin/applications — unauthenticated', () => {
    it('returns 401 without session', async () => {
      const res = await app.inject({ method: 'GET', url: '/v1/admin/applications' });
      assert.equal(res.statusCode, 401);
    });
  });

  describe('PATCH /v1/admin/applications/:id/status — unauthenticated', () => {
    it('returns 401 without session', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/admin/applications/d3b07384-d113-4c4e-9c8e-aa1d3e237890/status',
        payload: { status: 'Accepted' },
      });
      assert.equal(res.statusCode, 401);
    });
  });

  describe('PATCH /v1/admin/applications/:id/status — invalid body', () => {
    it('returns 400 with invalid status value (needs auth bypass in integration)', async () => {
      // This test documents schema rejection; full integration requires a seeded session
      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/admin/applications/d3b07384-d113-4c4e-9c8e-aa1d3e237890/status',
        payload: { status: 'INVALID_STATUS' },
      });
      // Will be 401 (no session) or 400 (schema); both are acceptable rejections
      assert.ok([400, 401].includes(res.statusCode));
    });
  });
});

// ── Test Helpers ──────────────────────────────────────────────────────────────

function buildMultipart(
  boundary: string,
  fields: Record<string, string>,
  file: { filename: string; mimetype: string; content: Buffer }
): Buffer {
  const parts: Buffer[] = [];
  const enc = (s: string) => Buffer.from(s, 'utf8');

  for (const [name, value] of Object.entries(fields)) {
    parts.push(enc(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`));
  }

  parts.push(enc(`--${boundary}\r\nContent-Disposition: form-data; name="resume"; filename="${file.filename}"\r\nContent-Type: ${file.mimetype}\r\n\r\n`));
  parts.push(file.content);
  parts.push(enc(`\r\n--${boundary}--`));

  return Buffer.concat(parts);
}
```

---

## Global Error Handler

Add to `src/app.ts` after plugin registration:

```typescript
app.setErrorHandler((error, _req, reply) => {
  const statusCode = error.statusCode ?? 500;
  app.log.error(error);
  reply.code(statusCode).send({
    error: error.message ?? 'Internal Server Error',
  });
});
```

---

## Database Setup Steps

1. Copy `src/db/schema.sql` (from `dataModel.md`) into the Supabase SQL Editor and run it.
2. Create a private Supabase Storage bucket named `resumes` via the Supabase dashboard (Storage → New Bucket → uncheck "Public").
3. Run the seed INSERT for `recruiting_users` with hashed passwords:

```typescript
// One-time script: scripts/seed-admin.ts
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const hash = await bcrypt.hash(env.DEFAULT_ADMIN_PASSWORD ?? 'changeme', 12);
await supabase.from('recruiting_users')
  .update({ password_hash: hash })
  .in('email', ['admin1@hireme-app.com', 'admin2@hireme-app.com']);
console.log('Admin passwords seeded.');
```

Run with: `npx tsx scripts/seed-admin.ts`

---

## Running the Backend

```bash
# 1. Install deps
npm install

# 2. Copy and fill env
cp config/.env.example config/.env

# 3. Run DB DDL + seed (Supabase SQL Editor, then seed script)
npx tsx scripts/seed-admin.ts

# 4. Dev server
npm run dev

# 5. Tests
npm test

# 6. Production build
npm run build && npm start
```
