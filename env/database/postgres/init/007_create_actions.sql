CREATE SCHEMA IF NOT EXISTS actions;

DO $$ BEGIN
    CREATE TYPE actions.action_run_status AS ENUM ('success', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS actions.actions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    org_id                  UUID NOT NULL REFERENCES orgs.organizations(id) ON DELETE CASCADE,

    name                    VARCHAR(255) NOT NULL,
    description             TEXT DEFAULT NULL,

    parameters              JSONB NOT NULL DEFAULT '[]'::jsonb,
    effects                 JSONB NOT NULL DEFAULT '[]'::jsonb,

    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now(),
    archived_at             TIMESTAMPTZ DEFAULT NULL
);

ALTER TABLE actions.actions
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS actions_org_id_idx ON actions.actions (org_id);
CREATE INDEX IF NOT EXISTS actions_org_active_idx ON actions.actions (org_id, created_at DESC)
    WHERE archived_at IS NULL;

CREATE OR REPLACE TRIGGER trg_actions_updated_at
    BEFORE UPDATE ON actions.actions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS actions.action_runs (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    action_id               UUID NOT NULL REFERENCES actions.actions(id) ON DELETE CASCADE,
    org_id                  UUID NOT NULL REFERENCES orgs.organizations(id) ON DELETE CASCADE,
    user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    parameters              JSONB NOT NULL DEFAULT '{}'::jsonb,
    changes                 JSONB NOT NULL DEFAULT '[]'::jsonb,
    status                  actions.action_run_status NOT NULL DEFAULT 'success',
    error_message           TEXT DEFAULT NULL,

    executed_at             TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE actions.action_runs
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS status actions.action_run_status NOT NULL DEFAULT 'success',
    ADD COLUMN IF NOT EXISTS error_message TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS action_runs_action_id_idx ON actions.action_runs (action_id);
CREATE INDEX IF NOT EXISTS action_runs_org_id_idx ON actions.action_runs (org_id);
CREATE INDEX IF NOT EXISTS action_runs_action_executed_at_idx ON actions.action_runs (action_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS action_runs_org_executed_at_idx ON actions.action_runs (org_id, executed_at DESC);
