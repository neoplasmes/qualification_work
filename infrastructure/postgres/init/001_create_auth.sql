-- схема для всех таблиц, отвечающих за авторизацию и аутентификацию
CREATE SCHEMA IF NOT EXISTS auth;

-- корневая таблица для данных пользователя
CREATE TABLE IF NOT EXISTS auth.users (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email                   VARCHAR(255) UNIQUE DEFAULT NULL,

    password_hash           TEXT NOT NULL,

    failed_login_attempts   INTEGER DEFAULT 0,
    locked_until            TIMESTAMPTZ DEFAULT NULL,
    is_initializing         BOOLEAN NOT NULL DEFAULT false,

    name                    VARCHAR(127) NOT NULL,
    family                  VARCHAR(127) NOT NULL,

    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON auth.users (email);

CREATE OR REPLACE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

