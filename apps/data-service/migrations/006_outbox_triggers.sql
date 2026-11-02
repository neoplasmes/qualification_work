-- every change of datasets and charts lands in data.outbox inside the same transaction,
-- so no write path (upload, merge, actions, row edits) can forget to publish an event

CREATE OR REPLACE FUNCTION data.write_event(
    _topic text,
    _type text,
    _aggregate_id uuid,
    _org_id uuid,
    _payload jsonb
)
RETURNS void AS $$
DECLARE
    _event_id uuid := gen_random_uuid();
BEGIN
    INSERT INTO data.outbox (event_id, topic, key, payload)
    VALUES (
        _event_id,
        _topic,
        _aggregate_id::text,
        jsonb_build_object(
            'eventId', _event_id,
            'type', _type,
            'version', 1,
            'occurredAt', to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
            'aggregateId', _aggregate_id,
            'orgId', _org_id,
            'payload', _payload
        )
    );
END;
$$ LANGUAGE plpgsql;

------------------------------------------------------------------------------------------------
-- datasets: the event carries the full state, so the topic can be compacted

CREATE OR REPLACE FUNCTION data.datasets_changed()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM data.write_event('data.dataset.v1', 'DatasetDeleted', OLD.id, OLD.org_id, '{}'::jsonb);

        RETURN NULL;
    END IF;

    PERFORM data.write_event(
        'data.dataset.v1',
        'DatasetChanged',
        NEW.id,
        NEW.org_id,
        jsonb_build_object(
            'name', NEW.name,
            'dataVersion', NEW.data_version,
            'columns', COALESCE(
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'key', c.key,
                            'dataType', c.data_type,
                            'isAnalyzable', c.is_analyzable
                        )
                        ORDER BY c.order_index
                    )
                    FROM data.dataset_columns c
                    WHERE c.dataset_id = NEW.id
                ),
                '[]'::jsonb
            )
        )
    );

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_datasets_outbox_insert
    AFTER INSERT ON data.datasets
    FOR EACH ROW EXECUTE FUNCTION data.datasets_changed();

-- updated_at alone is not a domain change
CREATE OR REPLACE TRIGGER trg_datasets_outbox_update
    AFTER UPDATE OF name, data_version ON data.datasets
    FOR EACH ROW
    WHEN (OLD.name IS DISTINCT FROM NEW.name OR OLD.data_version IS DISTINCT FROM NEW.data_version)
    EXECUTE FUNCTION data.datasets_changed();

CREATE OR REPLACE TRIGGER trg_datasets_outbox_delete
    AFTER DELETE ON data.datasets
    FOR EACH ROW EXECUTE FUNCTION data.datasets_changed();

------------------------------------------------------------------------------------------------
-- rows and columns bump data_version once per statement, which in turn emits DatasetChanged
-- transition tables keep bulk uploads at one bump per batch instead of one per row

CREATE OR REPLACE FUNCTION data.bump_data_version_from_new()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE data.datasets
    SET data_version = data_version + 1
    WHERE id IN (SELECT DISTINCT dataset_id FROM changed);

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_dataset_rows_version_insert
    AFTER INSERT ON data.dataset_rows
    REFERENCING NEW TABLE AS changed
    FOR EACH STATEMENT EXECUTE FUNCTION data.bump_data_version_from_new();

CREATE OR REPLACE TRIGGER trg_dataset_rows_version_update
    AFTER UPDATE ON data.dataset_rows
    REFERENCING NEW TABLE AS changed
    FOR EACH STATEMENT EXECUTE FUNCTION data.bump_data_version_from_new();

CREATE OR REPLACE TRIGGER trg_dataset_rows_version_delete
    AFTER DELETE ON data.dataset_rows
    REFERENCING OLD TABLE AS changed
    FOR EACH STATEMENT EXECUTE FUNCTION data.bump_data_version_from_new();

CREATE OR REPLACE TRIGGER trg_dataset_columns_version_insert
    AFTER INSERT ON data.dataset_columns
    REFERENCING NEW TABLE AS changed
    FOR EACH STATEMENT EXECUTE FUNCTION data.bump_data_version_from_new();

CREATE OR REPLACE TRIGGER trg_dataset_columns_version_update
    AFTER UPDATE ON data.dataset_columns
    REFERENCING NEW TABLE AS changed
    FOR EACH STATEMENT EXECUTE FUNCTION data.bump_data_version_from_new();

CREATE OR REPLACE TRIGGER trg_dataset_columns_version_delete
    AFTER DELETE ON data.dataset_columns
    REFERENCING OLD TABLE AS changed
    FOR EACH STATEMENT EXECUTE FUNCTION data.bump_data_version_from_new();

------------------------------------------------------------------------------------------------
-- charts

CREATE OR REPLACE FUNCTION charts.charts_changed()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM data.write_event('analytics.chart.v1', 'ChartDeleted', OLD.id, OLD.org_id, '{}'::jsonb);

        RETURN NULL;
    END IF;

    PERFORM data.write_event(
        'analytics.chart.v1',
        'ChartChanged',
        NEW.id,
        NEW.org_id,
        jsonb_build_object('datasetId', NEW.dataset_id, 'name', NEW.name)
    );

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_charts_outbox_insert
    AFTER INSERT ON charts.charts
    FOR EACH ROW EXECUTE FUNCTION charts.charts_changed();

CREATE OR REPLACE TRIGGER trg_charts_outbox_update
    AFTER UPDATE OF name, dataset_id ON charts.charts
    FOR EACH ROW
    WHEN (OLD.name IS DISTINCT FROM NEW.name OR OLD.dataset_id IS DISTINCT FROM NEW.dataset_id)
    EXECUTE FUNCTION charts.charts_changed();

CREATE OR REPLACE TRIGGER trg_charts_outbox_delete
    AFTER DELETE ON charts.charts
    FOR EACH ROW EXECUTE FUNCTION charts.charts_changed();
