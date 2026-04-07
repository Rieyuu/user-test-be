# Setup (User Test)

## Prerequisites

- PostgreSQL running (local)
- Node.js + pnpm

## Environment variables

Copy file contoh env:

```bash
cp .env.example .env
```

Sesuaikan nilai `.env` terutama `DB_*`.

## Database setup (SQL)

SQL ada di folder `sql/`:

- `sql/001_users.sql`: create table `users` + add column `deleted_at` (soft delete)
- `sql/002_refresh_tokens.sql`: create table `user_refresh_tokens` (untuk Soal 3)
- `sql/003_data_mhs.sql`: create type `jurusan_enum` + create table `data_mhs` (untuk Soal 4)

Jalankan SQL tersebut di database yang sama dengan `DB_NAME` pada `.env`.

## Running

```bash
pnpm install
pnpm run start:dev
```

