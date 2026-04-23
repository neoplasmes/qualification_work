CREATE SCHEMA IF NOT EXISTS charts;

DO $$ BEGIN
    CREATE TYPE charts.chart_type AS ENUM ('bar', 'line', 'pie', 'kpi', 'heatmap');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS charts.charts (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    dataset_id              UUID NOT NULL REFERENCES data.datasets(id) ON DELETE CASCADE,
    org_id                  UUID NOT NULL REFERENCES orgs.organizations(id) ON DELETE CASCADE,

    name                    VARCHAR(255) NOT NULL,
    chart_type              charts.chart_type NOT NULL,
    config                  JSONB NOT NULL DEFAULT '{}',

    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now()
);

-- ? Мб здесь и двойной индекс надо
CREATE INDEX IF NOT EXISTS charts_dataset_id_idx ON charts.charts (dataset_id);
CREATE INDEX IF NOT EXISTS charts_org_id_idx ON charts.charts (org_id);

CREATE OR REPLACE TRIGGER trg_charts_updated_at
    BEFORE UPDATE ON charts.charts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
