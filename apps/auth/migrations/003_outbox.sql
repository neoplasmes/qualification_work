-- events are written here in the same transaction as the change and relayed to kafka
CREATE TABLE IF NOT EXISTS auth.outbox (
    id                      BIGSERIAL PRIMARY KEY,
    event_id                UUID NOT NULL UNIQUE,
    topic                   TEXT NOT NULL,
    key                     TEXT NOT NULL,
    payload                 JSONB NOT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at            TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS outbox_unpublished_idx ON auth.outbox (id) WHERE published_at IS NULL;
