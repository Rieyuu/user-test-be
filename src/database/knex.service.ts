import { Injectable, OnModuleDestroy } from '@nestjs/common';
import knex, { Knex } from 'knex';
import config from './knexfile';

@Injectable()
export class KnexService implements OnModuleDestroy {
  private readonly knex: Knex;

  constructor() {
    this.knex = knex(config);
  }

  get connection(): Knex {
    return this.knex;
  }

  async onModuleDestroy() {
    await this.knex.destroy();
  }
}
