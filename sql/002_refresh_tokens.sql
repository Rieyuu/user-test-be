-- 002_refresh_tokens.sql
-- Table for refresh token storage (Soal 3).

CREATE TABLE IF NOT EXISTS user_refresh_tokens (
  id serial primary key,
  user_id integer not null references users(id) on delete cascade,
  token_hash varchar(255) not null,
  expires_at timestamp not null,
  revoked_at timestamp null,
  created_at timestamp not null default now()
);

CREATE INDEX IF NOT EXISTS idx_user_refresh_tokens_user_id
  ON user_refresh_tokens(user_id);

