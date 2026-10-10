CREATE TABLE IF NOT EXISTS businesses (id uuid PRIMARY KEY, name text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS users (id uuid PRIMARY KEY, business_id uuid NOT NULL REFERENCES businesses(id), email text NOT NULL UNIQUE, salt text NOT NULL, password_hash text NOT NULL, role text NOT NULL CHECK(role IN ('owner','staff')), created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS sessions (token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS records (business_id uuid NOT NULL REFERENCES businesses(id), kind text NOT NULL CHECK(kind IN ('clients','quotes','jobs','invoices','expenses','tasks','activity')), id uuid NOT NULL, source_id text, payload jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(business_id,kind,id));
CREATE INDEX IF NOT EXISTS idx_records_tenant_kind ON records(business_id,kind);

-- Snapshot tenant-isolated with optimistic concurrency; one snapshot per business.
CREATE TABLE IF NOT EXISTS snapshots (business_id uuid PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE, revision integer NOT NULL DEFAULT 1, payload jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());

CREATE UNIQUE INDEX IF NOT EXISTS idx_records_source_id ON records(business_id,kind,source_id) WHERE source_id IS NOT NULL;
