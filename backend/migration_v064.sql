-- Run once on an existing v0.6.3 database before starting v0.6.4.
ALTER TABLE records ADD COLUMN IF NOT EXISTS source_id text;
ALTER TABLE records DROP CONSTRAINT IF EXISTS records_kind_check;
ALTER TABLE records ADD CONSTRAINT records_kind_check CHECK(kind IN ('clients','quotes','jobs','invoices','expenses','tasks','activity'));
CREATE UNIQUE INDEX IF NOT EXISTS idx_records_source_id ON records(business_id,kind,source_id) WHERE source_id IS NOT NULL;
