CREATE TABLE IF NOT EXISTS career_profiles (
 user_id text PRIMARY KEY,
 data jsonb NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS career_documents (
 id uuid PRIMARY KEY,
 user_id text NOT NULL,
 title text NOT NULL CHECK (length(title) BETWEEN 1 AND 160),
 content text NOT NULL CHECK (length(content) BETWEEN 1 AND 30000),
 template text NOT NULL CHECK (template IN ('classic','modern','executive')),
 draft jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS career_documents_owner_created ON career_documents(user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS career_generation_usage (
 user_id text NOT NULL,
 usage_day date NOT NULL,
 attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
 last_attempt_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,usage_day)
);
