ALTER TABLE dashboards.item_metrics
    ADD COLUMN IF NOT EXISTS value_multiplier NUMERIC NOT NULL DEFAULT 1;

DO $$
DECLARE
    metric_format_type OID := to_regtype('dashboards.metric_format');
    has_legacy_metric_format BOOLEAN := FALSE;
BEGIN
    IF metric_format_type IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1
            FROM pg_attribute attr
            JOIN pg_class cls ON cls.oid = attr.attrelid
            JOIN pg_namespace ns ON ns.oid = cls.relnamespace
            WHERE ns.nspname = 'dashboards'
                AND cls.relname = 'item_metrics'
                AND attr.attname = 'format'
                AND attr.atttypid = metric_format_type
                AND NOT attr.attisdropped
        )
        INTO has_legacy_metric_format;
    END IF;

    IF has_legacy_metric_format THEN
        ALTER TABLE dashboards.item_metrics
            ALTER COLUMN format DROP DEFAULT,
            ALTER COLUMN format TYPE TEXT
            USING CASE format::TEXT
                WHEN 'number' THEN ''
                WHEN 'currency' THEN '₽'
                WHEN 'percent' THEN '%'
                ELSE format::TEXT
            END;

        UPDATE dashboards.item_metrics
        SET value_multiplier = 100
        WHERE format = '%' AND value_multiplier = 1;
    END IF;
END $$;

ALTER TABLE dashboards.item_metrics
    ALTER COLUMN format SET DEFAULT '',
    ALTER COLUMN format SET NOT NULL;

DROP TYPE IF EXISTS dashboards.metric_format;
