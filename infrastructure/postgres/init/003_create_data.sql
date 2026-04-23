CREATE SCHEMA IF NOT EXISTS data;

DO $$ BEGIN
    CREATE TYPE data.source_type AS ENUM ('csv', 'xlsx', 'manual');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE data.column_data_type AS ENUM ('number', 'string', 'date', 'bool');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Просто связующая таблица, данных в которых по сути нет
CREATE TABLE IF NOT EXISTS data.datasets (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    org_id                  UUID NOT NULL REFERENCES orgs.organizations(id) ON DELETE CASCADE,

    name                    VARCHAR(255) NOT NULL,
    source_type             data.source_type NOT NULL,

    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now()
);

-- все датасеты мапятся на конкретную организацию, и именно так и будет происходить индекс.
CREATE INDEX IF NOT EXISTS datasets_org_id_idx ON data.datasets (org_id);

CREATE OR REPLACE TRIGGER trg_datasets_updated_at
    BEFORE UPDATE ON data.datasets
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

--------------------------------------------------------------------------------------------------------------

-- колонки разных датасетов в общей куче((((
CREATE TABLE IF NOT EXISTS data.dataset_columns (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    dataset_id              UUID NOT NULL REFERENCES data.datasets(id) ON DELETE CASCADE,

    key                     VARCHAR(255) NOT NULL,
    display_name            VARCHAR(255) NOT NULL,

    data_type               data.column_data_type NOT NULL,

    order_index             INTEGER NOT NULL,

    UNIQUE (dataset_id, key)
);

-- очевидно
CREATE INDEX IF NOT EXISTS dataset_columns_dataset_id_idx ON data.dataset_columns (dataset_id);

----------------------------------------------------------------------------------------------------------
-- в рядах храним JSONB
CREATE TABLE IF NOT EXISTS data.dataset_rows (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    dataset_id              UUID NOT NULL REFERENCES data.datasets(id) ON DELETE CASCADE,

    row_index               INTEGER NOT NULL,

    data                    JSONB NOT NULL,

    UNIQUE (dataset_id, row_index)
);

-- очевидно
CREATE INDEX IF NOT EXISTS dataset_rows_dataset_id_idx ON data.dataset_rows (dataset_id);

-- TODO: получше разобраться м.б. если использовать GIN полностью, всё будет приемлемо
CREATE INDEX IF NOT EXISTS dataset_rows_data_gin_idx ON data.dataset_rows USING GIN (data jsonb_path_ops);
