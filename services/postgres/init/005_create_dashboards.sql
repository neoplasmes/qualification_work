CREATE SCHEMA IF NOT EXISTS dashboards;

DO $$ BEGIN
    CREATE TYPE dashboards.item_type AS ENUM ('chart', 'metric');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE dashboards.metric_format AS ENUM ('currency', 'percent', 'number');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

------------------------------------------------------------------------------------------------------------------
-- Инстанс дашборда
CREATE TABLE IF NOT EXISTS dashboards.dashboards (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    org_id                  UUID NOT NULL REFERENCES orgs.organizations(id) ON DELETE CASCADE,

    name                    VARCHAR(255) NOT NULL,

    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dashboards_org_id_idx ON dashboards.dashboards (org_id);

CREATE TRIGGER trg_dashboards_updated_at
    BEFORE UPDATE ON dashboards.dashboards
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

------------------------------------------------------------------------------------------------------------------
-- Позиции размещённых на дашборде элементов
CREATE TABLE IF NOT EXISTS dashboards.dashboard_items (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    dashboard_id            UUID NOT NULL REFERENCES dashboards.dashboards(id) ON DELETE CASCADE,

    item_type               dashboards.item_type NOT NULL,

    pos_x                   INTEGER NOT NULL,
    pos_y                   INTEGER NOT NULL,

    width                   INTEGER NOT NULL,
    height                  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS dashboard_items_dashboard_id_idx ON dashboards.dashboard_items (dashboard_id);

--------------------------------------------------------------------------------------------------------------------
-- Графики
CREATE TABLE IF NOT EXISTS dashboards.item_charts (
    item_id                 UUID PRIMARY KEY REFERENCES dashboards.dashboard_items(id) ON DELETE CASCADE,

    chart_id                UUID NOT NULL REFERENCES charts.charts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS item_charts_chart_id_idx ON dashboards.item_charts (chart_id);

--------------------------------------------------------------------------------------------------------------------
-- Отдельные метрики
CREATE TABLE IF NOT EXISTS dashboards.item_metrics (
    item_id                 UUID PRIMARY KEY REFERENCES dashboards.dashboard_items(id) ON DELETE CASCADE,

    dataset_id              UUID NOT NULL REFERENCES data.datasets(id) ON DELETE CASCADE,

    name                    VARCHAR(255) NOT NULL,

    expression              TEXT NOT NULL,

    format                  dashboards.metric_format NOT NULL
);

CREATE INDEX IF NOT EXISTS item_metrics_dataset_id_idx ON dashboards.item_metrics (dataset_id);
