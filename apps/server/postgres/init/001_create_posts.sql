-- Initial schema: posts table

CREATE TABLE IF NOT EXISTS posts (
  id         SERIAL PRIMARY KEY,
  title      TEXT    NOT NULL,
  content    TEXT    NOT NULL,
  author     TEXT    NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO posts (title, content, author) VALUES
  ('Hello World',         'First post on this platform. Welcome!',                  'alice'),
  ('Getting Started',     'Here is how to get started with our app...',             'bob'),
  ('Tips and Tricks',     'Some useful tips for power users.',                      'alice'),
  ('Release Notes v1.0',  'We are happy to announce the first stable release!',     'admin'),
  ('Community Update',    'The community has grown to 500 members this month.',     'admin');
