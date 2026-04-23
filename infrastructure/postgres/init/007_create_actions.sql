CREATE SCHEMA IF NOT EXISTS actions;

CREATE TABLE IF NOT EXISTS actions.actions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    org_id                  UUID NOT NULL REFERENCES orgs.organizations(id) ON DELETE CASCADE,

    name                    VARCHAR(255) NOT NULL,
    description             TEXT DEFAULT NULL,

    parameters              JSONB NOT NULL DEFAULT '[]'::jsonb,
    effects                 JSONB NOT NULL DEFAULT '[]'::jsonb,

    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS actions_org_id_idx ON actions.actions (org_id);

CREATE OR REPLACE TRIGGER trg_actions_updated_at
    BEFORE UPDATE ON actions.actions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS actions.action_runs (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    action_id               UUID NOT NULL REFERENCES actions.actions(id) ON DELETE CASCADE,
    org_id                  UUID NOT NULL REFERENCES orgs.organizations(id) ON DELETE CASCADE,

    parameters              JSONB NOT NULL DEFAULT '{}'::jsonb,
    changes                 JSONB NOT NULL DEFAULT '[]'::jsonb,

    executed_at             TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS action_runs_action_id_idx ON actions.action_runs (action_id);
CREATE INDEX IF NOT EXISTS action_runs_org_id_idx ON actions.action_runs (org_id);
