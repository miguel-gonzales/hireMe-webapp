-- Supabase schema for HireMe backend

DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS recruiting_users;
DROP TYPE IF EXISTS english_level_enum;
DROP TYPE IF EXISTS application_status_enum;
DROP FUNCTION IF EXISTS update_modified_column;

CREATE TYPE english_level_enum AS ENUM (
  'Beginner (A1/A2)',
  'Intermediate (B1/B2)',
  'Advanced (C1)',
  'Native / Fluent (C2)'
);

CREATE TYPE application_status_enum AS ENUM (
  'In Review',
  'Accepted',
  'Rejected'
);

CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE recruiting_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  age INTEGER NOT NULL,
  country VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  english_level english_level_enum NOT NULL,
  resume_storage_path VARCHAR(512) NOT NULL,
  status application_status_enum NOT NULL DEFAULT 'In Review',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_valid_age CHECK (age >= 16 AND age <= 100),
  CONSTRAINT check_email_format CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$')
);

CREATE TRIGGER update_recruiting_users_modtime
  BEFORE UPDATE ON recruiting_users
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_applications_modtime
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

CREATE INDEX idx_applications_status_created ON applications(status, created_at DESC);
CREATE INDEX idx_applications_email ON applications(email);

INSERT INTO recruiting_users (email, password_hash)
VALUES
  ('admin1@hireme-app.com', 'PENDING_INITIALIZATION'),
  ('admin2@hireme-app.com', 'PENDING_INITIALIZATION')
ON CONFLICT (email) DO NOTHING;
