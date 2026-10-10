-- Travlova authentication: initial durable user store.
-- Apply to the Neon Preview database/branch only for this PR.
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(80) NOT NULL,
  email VARCHAR(254) NOT NULL,
  country VARCHAR(5) NOT NULL,
  password_hash TEXT NOT NULL,
  email_verified_at TIMESTAMPTZ,
  session_version INTEGER NOT NULL DEFAULT 0 CHECK (session_version >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_email_normalized CHECK (email = lower(btrim(email))),
  CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS users_created_at_idx ON users (created_at DESC);
