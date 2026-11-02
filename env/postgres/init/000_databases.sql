-- every service owns a database and applies its own migrations on startup
-- \gexec keeps the script idempotent for the cluster migration job
SELECT format('CREATE DATABASE %I', name)
FROM unnest(ARRAY['auth', 'dashboards', 'data']) AS name
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = name)
\gexec
