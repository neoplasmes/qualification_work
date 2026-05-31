DO $$ BEGIN
    CREATE TYPE dashboards.metric_target_direction AS ENUM ('higher', 'lower');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE dashboards.item_metrics
    ADD COLUMN IF NOT EXISTS target           NUMERIC NULL,
    ADD COLUMN IF NOT EXISTS target_direction dashboards.metric_target_direction NULL;
