import { Knex } from 'knex';

const config: Knex.Config = {
  client: 'pg',
  connection: {
    host: 'localhost',
    user: 'postgres',
    password: '1sampai8',
    database: 'user_test_tik_upnvj',
  },
};

export default config;
