import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(process.cwd(), 'config', '.env') });

function requireEnv(key) {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}
function parseIntEnv(key, fallback) {
    const value = process.env[key] ?? fallback;
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) {
        throw new Error(`Environment variable ${key} must be an integer. Received: ${value}`);
    }
    return parsed;
}
export const env = {
    NODE_ENV: process.env.NODE_ENV ?? 'development',
    PORT: parseIntEnv('PORT', '8080'),
    HOST: process.env.HOST ?? '0.0.0.0',
    SUPABASE_URL: requireEnv('SUPABASE_URL'),
    SUPABASE_SERVICE_ROLE_KEY: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    SESSION_SECRET: requireEnv('SESSION_SECRET'),
    DEFAULT_ADMIN_PASSWORD: requireEnv('DEFAULT_ADMIN_PASSWORD'),
    SUPABASE_RESUMES_BUCKET: process.env.SUPABASE_RESUMES_BUCKET ?? 'resumes',
    RESUME_SIGNED_URL_EXPIRES_IN: parseIntEnv('RESUME_SIGNED_URL_EXPIRES_IN', '3600'),
};
