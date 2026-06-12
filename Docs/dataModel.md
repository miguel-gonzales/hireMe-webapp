# Data Model Specification: HireMe App MVP

This document defines the relational database architecture and data model for the **HireMe** application MVP. The design aligns directly with the functional criteria detailed in the User Stories and the constraints outlined in the Product Vision.

---

## 1. Architectural Overview & Design Rationales

### 1.1 Relational Integrity & State Management
To support the core MVP pipeline, a robust relational architecture is implemented via **Supabase** (managed **PostgreSQL**). Although the MVP requires only a single primary workflow table (`applications`) and basic access management (`recruiting_users`), the model enforces strict type safety, automatic audit tracking, and deterministic status transitions using native database constraints.

### 1.2 Supabase Platform & CV Storage
Binary CV assets are **not** stored in PostgreSQL. The backend uploads PDF files to a **Supabase Storage** bucket (e.g. `resumes`) and persists only the object path in `applications.resume_storage_path`. When a recruiter previews a CV, the API generates a time-limited **signed URL** from that path; signed URLs are not stored in the database.

### 1.3 Hand-Off to OpenAPI Contract
To guarantee seamless synchronization between the database persistence layer and the backend REST API (to be defined in the OpenAPI specification), all column names utilize `snake_case`, matching standard serialization formats. Column constraints and types are mapped explicitly to strict JSON schema validations:
- **Enums & Formats:** PostgreSQL custom types (`english_level_enum`, `application_status_enum`) correspond to OpenAPI string enums.
- **Validations:** Native database check constraints (e.g., age boundaries, email regex patterns) reflect string formats (`email`, `uri`) and integer limits (`minimum`, `maximum`) in the API contract.

---

## 2. Entity-Relationship Diagram (ERD) Conceptualization

```
+-----------------------------------+          +-----------------------------------+
|          RECRUITING_USERS         |          |            APPLICATIONS           |
+-----------------------------------+          +-----------------------------------+
| PK | id            : UUID         |          | PK | id            : UUID         |
|    | email         : VARCHAR(255) |          |    | full_name     : VARCHAR(100) |
|    | password_hash : VARCHAR(255) |          |    | email         : VARCHAR(255) |
|    | created_at    : TIMESTAMPTZ  |          |    | phone         : VARCHAR(30)  |
|    | updated_at    : TIMESTAMPTZ  |          |    | age           : INT          |
+-----------------------------------+          |    | country       : VARCHAR(100) |
                                               |    | city          : VARCHAR(100) |
                                               |    | english_level : ENUM         |
                                               |    | resume_storage_path : VARCHAR(512) |
                                               |    | status        : ENUM         |
                                               |    | created_at    : TIMESTAMPTZ  |
                                               |    | updated_at    : TIMESTAMPTZ  |
                                               +-----------------------------------+
```

---

## 3. Data Dictionary

### 3.1 Custom Enumerated Types (ENUMs)

#### `english_level_enum`
Enforces the technical constraints and standardized discrete tiers defined in the vision specification.

| Value | Technical Name | Description |
| :--- | :--- | :--- |
| `Beginner (A1/A2)` | `Beginner (A1/A2)` | Elementary English proficiency |
| `Intermediate (B1/B2)` | `Intermediate (B1/B2)` | Independent English proficiency |
| `Advanced (C1)` | `Advanced (C1)` | Advanced professional English proficiency |
| `Native / Fluent (C2)` | `Native / Fluent (C2)` | Mastery or native-level English proficiency |

#### `application_status_enum`
Defines the atomic states allowed within the pipeline state machine.

| Value | Technical Name | Description |
| :--- | :--- | :--- |
| `In Review` | `In Review` | Default state assigned automatically upon profile submission |
| `Accepted` | `Accepted` | Transitioned explicitly by a recruiter admin when candidate passes review |
| `Rejected` | `Rejected` | Transitioned explicitly by a recruiter admin if candidate is unfit |

---

### 3.2 Table: `applications`
Stores the candidate registration profiles and secure references to their attached CVs.

| Column Name | PostgreSQL Data Type | Constraints / Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique identifier for each candidate application. |
| `full_name` | `VARCHAR(100)` | `NOT NULL` | The full legal name of the candidate. |
| `email` | `VARCHAR(255)` | `NOT NULL`, `CHECK (pattern)` | Validated email address. Evaluated with check constraint logic. |
| `phone` | `VARCHAR(30)` | `NOT NULL` | International format string capturing candidate contact number. |
| `age` | `INTEGER` | `NOT NULL`, `CHECK (age >= 16 AND age <= 100)` | Integer field restricting valid workforce age boundaries. |
| `country` | `VARCHAR(100)` | `NOT NULL` | Dropdown-selected country name. |
| `city` | `VARCHAR(100)` | `NOT NULL` | Text field storing target metropolitan location. |
| `english_level` | `english_level_enum` | `NOT NULL` | Standardized discrete tiers matching CEFR benchmarks. |
| `resume_storage_path` | `VARCHAR(512)` | `NOT NULL` | Object path within the Supabase Storage `resumes` bucket (e.g. `{application_id}/resume.pdf`). Used server-side to generate signed preview URLs. |
| `status` | `application_status_enum` | `NOT NULL`, `DEFAULT 'In Review'` | Current location within the candidate lifecycle state machine. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | Audit timestamp tracking initial ingestion time. |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | Audit timestamp updated dynamically on state modifications. |

---

### 3.3 Table: `recruiting_users`
Stores administrative profiles authorized to access the dashboard backlog and alter application states.

| Column Name | PostgreSQL Data Type | Constraints / Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique tracking identifier for internal recruiter accounts. |
| `email` | `VARCHAR(255)` | `NOT NULL`, `UNIQUE` | Authenticating login email address. |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | Cryptographic hash secure string (e.g., bcrypt/argon2) for basic session validation. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | Administrative audit tracking creation time. |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | Administrative audit tracking mutation window. |

---

## 4. PostgreSQL DDL Implementation Script

The following production-ready DDL script includes custom types, validation filters, auto-updating triggers, and optimized indexes to implement the specifications above.

```sql
-- Supabase provides PostgreSQL 15+ with gen_random_uuid() built in; no extension required.

-- ==========================================
-- 1. DROP EXISTING CONSTRUCTS (Idempotency)
-- ==========================================
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS recruiting_users;
DROP TYPE IF EXISTS english_level_enum;
DROP TYPE IF EXISTS application_status_enum;
DROP FUNCTION IF EXISTS update_modified_column;

-- ==========================================
-- 2. CREATE CUSTOM ENUMERATED TYPES
-- ==========================================
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

-- ==========================================
-- 3. CREATE SHARED UTILITIES
-- ==========================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 4. CREATE TABLES
-- ==========================================

-- Table: Recruiting Users (Admin Authentication Wrapper)
CREATE TABLE recruiting_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: Applications (Core MVP Engine Engine)
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
    
    -- Business Validations via Database Constraints
    CONSTRAINT check_valid_age CHECK (age >= 16 AND age <= 100),
    CONSTRAINT check_email_format CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$')
);

-- ==========================================
-- 5. ATTACH DATABASE TRIGGERS
-- ==========================================
CREATE TRIGGER update_recruiting_users_modtime
    BEFORE UPDATE ON recruiting_users
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_applications_modtime
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- ==========================================
-- 6. PERFORMANCE OPTIMIZATION & INDEXES
-- ==========================================
-- Optimize pipeline operations when recruiters filter candidates by state or sort by date
CREATE INDEX idx_applications_status_created ON applications(status, created_at DESC);

-- Optimize unique lookups on emails
CREATE INDEX idx_applications_email ON applications(email);
```

---

## 5. Security & Ingestion Considerations
1. **CV Asset Storage (Supabase Storage):** In alignment with file constraints (PDF format up to 5MB), binary blobs must never be written directly to PostgreSQL fields. On application submission, the backend must:
   - Validate the upload is PDF (`application/pdf`) and within the 5MB limit.
   - Upload the file to a **private** Supabase Storage bucket named `resumes` using a deterministic path such as `{application_id}/resume.pdf`.
   - Persist only `resume_storage_path` in the database.
   - On recruiter profile inspection, generate a short-lived signed URL via the Supabase Storage API and return it as `resume_url` in the REST response (see OpenAPI `Application` schema).
2. **Supabase Storage bucket policy:** The `resumes` bucket must remain private; only the backend service role (or equivalent server-side credential) may upload objects and create signed URLs. Public bucket access is not required for MVP.
3. **Data De-duplication Rule:** For the baseline MVP release, a candidate is technically allowed to create separate application entries under the same email address if applying for distinct roles. To strictly enforce a one-to-one rule per candidate backlog, a `UNIQUE` identifier check can be declared on `applications.email`.
