process.env.SESSION_SECRET = process.env.SESSION_SECRET ?? 'test-secret';
process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://localhost';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'test-role';
process.env.DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD ?? 'password123';
process.env.SUPABASE_RESUMES_BUCKET = process.env.SUPABASE_RESUMES_BUCKET ?? 'resumes';
process.env.RESUME_SIGNED_URL_EXPIRES_IN = process.env.RESUME_SIGNED_URL_EXPIRES_IN ?? '3600';
process.env.PORT = process.env.PORT ?? '8080';
process.env.HOST = process.env.HOST ?? '127.0.0.1';
