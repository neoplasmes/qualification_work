CREATE SCHEMA IF NOT EXISTS orgs;

DO $$ BEGIN
    CREATE TYPE orgs.org_role AS ENUM ('viewer', 'editor', 'owner');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS orgs.organizations (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- CASCADE типо будет вести себя слишком непредсказуемо в данном случае
    owner_id                UUID REFERENCES auth.users (id) ON DELETE SET NULL,

    name                    VARCHAR(255) UNIQUE NOT NULL,

    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE TRIGGER trg_organizations_updated_at
    BEFORE UPDATE ON orgs.organizations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS orgs_owner_id_idx ON orgs.organizations (owner_id);

------------------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS orgs.roles (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    org_id                  UUID REFERENCES orgs.organizations(id) ON DELETE CASCADE,
    user_id                 UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    role                    orgs.org_role NOT NULL,

    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now(),

    UNIQUE (org_id, user_id)
);

CREATE INDEX IF NOT EXISTS roles_user_id_idx ON orgs.roles (user_id);
CREATE INDEX IF NOT EXISTS roles_org_id_user_id_idx ON orgs.roles (org_id, user_id);

CREATE OR REPLACE TRIGGER trg_roles_updated_at
    BEFORE UPDATE ON orgs.roles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
