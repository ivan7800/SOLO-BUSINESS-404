-- Apply after schema.sql and migration_v064.sql; backup first.
ALTER TABLE records ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 1;
ALTER TABLE records ADD CONSTRAINT records_revision_positive CHECK (revision > 0);
CREATE INDEX IF NOT EXISTS idx_records_tenant_modified ON records(business_id,updated_at DESC);
