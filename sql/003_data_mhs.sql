-- 003_data_mhs.sql
-- Table for Mahasiswa (Soal 4).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'jurusan_enum') THEN
    CREATE TYPE jurusan_enum AS ENUM (
      'Informatika',
      'Sistem Informasi',
      'Teknik Elektro',
      'Manajemen'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS data_mhs (
  id SERIAL PRIMARY KEY,
  nim VARCHAR(20) NOT NULL UNIQUE,
  nama VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  jurusan jurusan_enum NOT NULL,
  tanggal_lahir DATE NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

