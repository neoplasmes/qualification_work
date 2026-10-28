CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- this is used only for tests actually
CREATE OR REPLACE FUNCTION truncate_all_tables(_schema text DEFAULT 'public')
RETURNS void AS $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = _schema
    LOOP
        EXECUTE format('TRUNCATE TABLE %I.%I RESTART IDENTITY CASCADE', _schema, tbl);
    END LOOP;
END;
$$ LANGUAGE plpgsql;
