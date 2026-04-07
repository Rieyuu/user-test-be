# API

## Users

- `POST /users`
- `GET /users`
- `GET /users/:id`
- `GET /users/by-email/:email`
- `PATCH /users/:id`
- `DELETE /users/:id` (soft delete; set `deleted_at` + `is_active=false`)

