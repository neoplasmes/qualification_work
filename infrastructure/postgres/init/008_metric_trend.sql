DO $$ BEGIN
    CREATE TYPE dashboards.metric_time_bucket AS ENUM ('day', 'week', 'month');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE dashboards.item_metrics
    -- whether the micro-chart should be shown under the metric card
    ADD COLUMN IF NOT EXISTS show_trend  BOOLEAN NOT NULL DEFAULT FALSE,
    -- time-cloumn for grouping. If NULL - an auto-grouping will be performed
    ADD COLUMN IF NOT EXISTS time_column TEXT NULL,
    ADD COLUMN IF NOT EXISTS time_bucket dashboards.metric_time_bucket NULL;
