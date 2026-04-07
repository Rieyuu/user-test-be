# Endpoint Testing

Dokumentasi ini berisi panduan testing endpoint (Postman) dari setup sampai seluruh soal selesai.

## Setup (sebelum testing)

1) Buat file env.

```bash
cp .env.example .env
```

2) Sesuaikan `.env` (minimal `DB_*` dan `JWT_*`).

3) Jalankan SQL berikut di database yang sama dengan `DB_NAME`:

- `sql/001_users.sql`
- `sql/002_refresh_tokens.sql`
- `sql/003_data_mhs.sql`

4) Jalankan app.

```bash
pnpm install
pnpm run start:dev
```

Base URL: `http://localhost:3000`

## Konvensi response error (umum)

- **400 Bad Request**: validasi DTO gagal (contoh: email tidak valid, field wajib kosong).
- **401 Unauthorized**: kredensial login salah / token invalid.
- **403 Forbidden**: refresh token sudah revoked / user inactive.
- **404 Not Found**: data tidak ditemukan (termasuk user yang sudah soft delete).
- **409 Conflict**: unique constraint (email / nim) bentrok.

## Users

### 1) Create user
- **POST** `/users`
- Body:

```json
{
  "email": "budi@example.com",
  "name": "Budi",
  "password": "password123",
  "is_active": true
}
```

- Expected:
  - **201**
  - Response tidak mengembalikan password.

**Response berhasil (201) contoh**

```json
{
  "id": 1,
  "email": "budi@example.com",
  "name": "Budi",
  "is_active": true,
  "register_date": "2026-04-06T11:21:28.500Z"
}
```

**Case email sudah ada (409)**

```json
{
  "statusCode": 409,
  "message": "email already exists",
  "error": "Conflict"
}
```

**Case validasi gagal (400) contoh**
Request:

```json
{ "email": "bukan-email", "name": "", "password": "" }
```

Response (contoh):

```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "name should not be empty",
    "password should not be empty"
  ],
  "error": "Bad Request"
}
```

### 2) Get all users
- **GET** `/users`
- Expected: **200** array user (yang `deleted_at` null).

**Response berhasil (200) contoh**

```json
[
  {
    "id": 1,
    "email": "budi@example.com",
    "name": "Budi",
    "is_active": true,
    "register_date": "2026-04-06T11:21:28.500Z"
  }
]
```

### 3) Get user by id
- **GET** `/users/:id`
- Example: `/users/1`
- Expected:
  - **200** jika ada
  - **404** jika tidak ada / sudah soft-deleted

**Response 404 contoh**

```json
{ "statusCode": 404, "message": "user not found", "error": "Not Found" }
```

### 4) Get user by email
- **GET** `/users/by-email/:email`
- Example: `/users/by-email/budi@example.com`
- Expected:
  - **200** jika ada
  - **404** jika tidak ada / sudah soft-deleted

### 5) Update user
- **PATCH** `/users/:id`
- Body (contoh):

```json
{
  "name": "Budi Update",
  "email": "budi2@example.com"
}
```

- Expected:
  - **200**
  - Kalau email bentrok: **409** message **`email already exists`**
  - Kalau name/email dikirim tapi kosong: **400**

### 6) Remove user (soft delete)
- **DELETE** `/users/:id`
- Expected:
  - **200** (mengembalikan user response) dan record akan:
    - `deleted_at` terisi
    - `is_active` menjadi `false`
  - **404** jika id tidak ada / sudah soft-deleted

## Auth (JWT + Refresh Token)

### 1) Login
- **POST** `/auth/login`
- Body:

```json
{
  "email": "budi@example.com",
  "password": "password123"
}
```

- Expected:
  - **200**
  - Response:

```json
{
  "accessToken": "<jwt-access>",
  "refreshToken": "<jwt-refresh>"
}
```

**Case password salah (401) contoh**

```json
{
  "statusCode": 401,
  "message": "invalid credentials",
  "error": "Unauthorized"
}
```

**Case user inactive (403) contoh**

```json
{
  "statusCode": 403,
  "message": "user is inactive",
  "error": "Forbidden"
}
```

### 2) Refresh access token
- **POST** `/auth/refresh`
- Body:

```json
{
  "refreshToken": "<jwt-refresh>"
}
```

- Expected:
  - **200**
  - Response:

```json
{
  "accessToken": "<jwt-access-baru>"
}
```

**Case refresh token invalid/expired (401) contoh**

```json
{
  "statusCode": 401,
  "message": "invalid refresh token",
  "error": "Unauthorized"
}
```

**Case refresh token revoked (403) contoh**

```json
{
  "statusCode": 403,
  "message": "refresh token revoked",
  "error": "Forbidden"
}
```

### 3) Logout (revoke refresh token)
- **POST** `/auth/logout`
- Body:

```json
{
  "refreshToken": "<jwt-refresh>"
}
```

- Expected:
  - **204 No Content**

### 4) Cek JWT guard (protected)
- **GET** `/auth/me`
- Header:
  - `Authorization: Bearer <jwt-access>`
- Expected:
  - **200**
  - Response:

```json
{ "ok": true }
```

**Case tanpa token / token invalid (401)**

```json
{ "statusCode": 401, "message": "Unauthorized", "error": "Unauthorized" }
```

## Mahasiswa (data_mhs)

### 1) Create mahasiswa
- **POST** `/mahasiswa`
- Body:

```json
{
  "nim": "1232223",
  "nama": "Budi",
  "email": "budi@gmail.com",
  "jurusan": "Informatika",
  "tanggal_lahir": "2001-01-01"
}
```

- Expected:
  - **201**
  - Jika `nim` atau `email` sudah ada: **409** (message `nim/email already exists`)

**Case jurusan tidak valid (400) contoh**
Request:

```json
{ "nim": "1", "nama": "A", "jurusan": "Manajement" }
```

Response (contoh):

```json
{
  "statusCode": 400,
  "message": ["jurusan must be one of the following values: Informatika, Sistem Informasi, Teknik Elektro, Manajemen"],
  "error": "Bad Request"
}
```

### 2) Update mahasiswa
- **PATCH** `/mahasiswa/:id`
- Body (contoh):

```json
{
  "nama": "Budi Update",
  "jurusan": "Sistem Informasi"
}
```

- Expected:
  - **200**
  - **404** jika tidak ada

### 3) Delete mahasiswa (hard delete)
- **DELETE** `/mahasiswa/:id`
- Expected:
  - **204 No Content**
  - **404** jika tidak ada

### 4) List mahasiswa (pagination + dynamic where)
- **GET** `/mahasiswa?page=1&limit=10`

Dynamic where (contoh):
- `/mahasiswa?email=budi@gmail.com`
- `/mahasiswa?nim=1232223`
- `/mahasiswa?nama=budi&jurusan=manajemen` (jurusan case-insensitive)

- Expected:
  - **200**
  - Response:

```json
{
  "data": [],
  "meta": { "page": 1, "limit": 10, "total": 0 }
}
```

**Case jurusan tidak sesuai enum (400)**
Contoh: `/mahasiswa?jurusan=abc`

```json
{
  "statusCode": 400,
  "message": ["jurusan must be one of the following values: Informatika, Sistem Informasi, Teknik Elektro, Manajemen"],
  "error": "Bad Request"
}
```

