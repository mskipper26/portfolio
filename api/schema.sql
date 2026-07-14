-- api/schema.sql — comments table for the portfolio comment API.
-- Mounted into the Postgres container's /docker-entrypoint-initdb.d/ so it runs
-- on first init; the API also runs it idempotently on startup (see server.js).

CREATE TABLE IF NOT EXISTS comments (
  id         BIGSERIAL    PRIMARY KEY,
  thread     TEXT         NOT NULL,          -- page URL path, e.g. /blog/foo/part-2/
  author     VARCHAR(25)  NOT NULL,
  body       VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS comments_thread_idx ON comments (thread, created_at);