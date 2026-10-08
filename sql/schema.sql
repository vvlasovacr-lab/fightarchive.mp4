CREATE TABLE IF NOT EXISTS sources (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  reliability NUMERIC(4,2) NOT NULL DEFAULT 0.7,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  canonical_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT,
  category TEXT NOT NULL,
  importance NUMERIC(4,2),
  novelty NUMERIC(4,2),
  viral_potential NUMERIC(4,2),
  source_reliability NUMERIC(4,2),
  audience_fit NUMERIC(4,2),
  total_score NUMERIC(5,2),
  status TEXT NOT NULL DEFAULT 'DISCOVERED',
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  raw_json JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS articles (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT REFERENCES events(id) ON DELETE CASCADE,
  source_id INT REFERENCES sources(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  published_at TIMESTAMPTZ,
  excerpt TEXT,
  raw_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posts (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT REFERENCES events(id) ON DELETE SET NULL,
  post_type TEXT NOT NULL,
  text TEXT NOT NULL,
  media_url TEXT,
  telegram_message_id BIGINT,
  status TEXT NOT NULL DEFAULT 'QUEUED',
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
  telegram_message_id BIGINT PRIMARY KEY,
  chat_id BIGINT NOT NULL,
  user_id BIGINT,
  username TEXT,
  text TEXT,
  status TEXT NOT NULL DEFAULT 'NEW',
  moderation_confidence NUMERIC(4,3),
  moderation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  moderated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ads (
  id BIGSERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  media_url TEXT,
  scheduled_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS moderation_actions (
  id BIGSERIAL PRIMARY KEY,
  telegram_message_id BIGINT,
  user_id BIGINT,
  action TEXT NOT NULL,
  reason TEXT,
  confidence NUMERIC(4,3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_status_score ON events(status, total_score DESC);
CREATE INDEX IF NOT EXISTS idx_posts_status_schedule ON posts(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
