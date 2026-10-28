DO $$ BEGIN
    CREATE TYPE dashboards.variable_type AS ENUM ('column_filter', 'date_range', 'number_range');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS dashboards.dashboard_variables (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    dashboard_id            UUID NOT NULL REFERENCES dashboards.dashboards(id) ON DELETE CASCADE,
    dataset_id              UUID NOT NULL REFERENCES data.datasets(id) ON DELETE CASCADE,

    name                    VARCHAR(255) NOT NULL,
    variable_type           dashboards.variable_type NOT NULL,
    column_key              VARCHAR(255) NOT NULL,

    config                  JSONB NOT NULL DEFAULT '{}'::jsonb,
    default_value           JSONB NOT NULL DEFAULT 'null'::jsonb,
    order_index             INTEGER NOT NULL DEFAULT 0,

    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dashboard_variables_dashboard_id_idx
    ON dashboards.dashboard_variables (dashboard_id);

CREATE INDEX IF NOT EXISTS dashboard_variables_dataset_id_idx
    ON dashboards.dashboard_variables (dataset_id);

CREATE OR REPLACE TRIGGER trg_dashboard_variables_updated_at
    BEFORE UPDATE ON dashboards.dashboard_variables
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
