-- deduplicates at-least-once kafka delivery per consumer group
CREATE TABLE IF NOT EXISTS dashboards.processed_events (
    event_id                UUID NOT NULL,
    consumer                TEXT NOT NULL,
    processed_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (event_id, consumer)
);
