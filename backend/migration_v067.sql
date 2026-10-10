-- Ejecutar después de migration_v065.sql, con copia de seguridad previa.
-- Permite borrado lógico y protección frente a resurrección de registros.
ALTER TABLE records ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_records_tenant_active ON records(business_id,kind,source_id) WHERE deleted_at IS NULL;
