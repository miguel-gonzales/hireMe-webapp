import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const configDir = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(configDir, '.env') })

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

function normalizeSupabaseUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl)
    url.pathname = url.pathname.replace(/\/rest\/v1\/?$/, '')
    return url.toString().replace(/\/$/, '')
  } catch (error) {
    throw new Error(`Invalid SUPABASE_URL: ${rawUrl}`)
  }
}

function parseIntEnv(key: string, fallback: string): number {
  const value = process.env[key] ?? fallback
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be an integer. Received: ${value}`)
  }
  return parsed
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: parseIntEnv('PORT', '8080'),
  HOST: process.env.HOST ?? '0.0.0.0',
  SUPABASE_URL: normalizeSupabaseUrl(requireEnv('SUPABASE_URL')),
  SUPABASE_SERVICE_ROLE_KEY: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  SESSION_SECRET: requireEnv('SESSION_SECRET'),
  DEFAULT_ADMIN_PASSWORD: requireEnv('DEFAULT_ADMIN_PASSWORD'),
  SUPABASE_RESUMES_BUCKET: process.env.SUPABASE_RESUMES_BUCKET ?? 'resumes',
  RESUME_SIGNED_URL_EXPIRES_IN: parseIntEnv('RESUME_SIGNED_URL_EXPIRES_IN', '3600'),
} as const;
