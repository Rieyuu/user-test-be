import 'dotenv/config';
import { Knex } from 'knex';

const config: Knex.Config = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST?.trim() ?? 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT.trim()) : 5432,
    user: process.env.DB_USER?.trim() ?? 'postgres',
    password: process.env.DB_PASSWORD?.trim() ?? 'password',
    database: process.env.DB_NAME?.trim() ?? 'postgres',
  },
};

export default config;
