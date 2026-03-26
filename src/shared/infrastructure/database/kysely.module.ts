import { DynamicModule, Module, OnModuleDestroy } from '@nestjs/common';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

export interface KyselyModuleOptions {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  token: symbol;
}

@Module({})
export class KyselyModule implements OnModuleDestroy {
  private static pools: Pool[] = [];

  static forFeature<T>(options: KyselyModuleOptions): DynamicModule {
    const pool = new Pool({
      host: options.host,
      port: options.port,
      user: options.user,
      password: options.password,
      database: options.database,
      max: 10,
    });

    KyselyModule.pools.push(pool);

    const dialect = new PostgresDialect({ pool });
    const db = new Kysely<T>({ dialect });

    return {
      module: KyselyModule,
      providers: [
        {
          provide: options.token,
          useValue: db,
        },
      ],
      exports: [options.token],
    };
  }

  async onModuleDestroy(): Promise<void> {
    for (const pool of KyselyModule.pools) {
      await pool.end();
    }
  }
}
