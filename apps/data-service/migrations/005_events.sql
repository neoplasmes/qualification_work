-- events are written here in the same transaction as the change and relayed to kafka
CREATE TABLE IF NOT EXISTS data.outbox (
    id                      BIGSERIAL PRIMARY KEY,
    event_id                UUID NOT NULL UNIQUE,
    topic                   TEXT NOT NULL,
    key                     TEXT NOT NULL,
    payload                 JSONB NOT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at            TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS outbox_unpublished_idx ON data.outbox (id) WHERE published_at IS NULL;

-- deduplicates at-least-once kafka delivery per consumer group
CREATE TABLE IF NOT EXISTS data.processed_events (
    event_id                UUID NOT NULL,
    consumer                TEXT NOT NULL,
    processed_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (event_id, consumer)
);
