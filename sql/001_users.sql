-- 001_users.sql
-- Base table from the test instructions + soft delete column.

CREATE TABLE IF NOT EXISTS users (
  id serial primary key,
  email VARCHAR(150) not null unique,
  name varchar(150) not null,
  password varchar(255),
  is_active boolean not null,
  register_date timestamp
);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;

