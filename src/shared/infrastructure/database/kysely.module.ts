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

export interface KyselyModuleAsyncOptions {
  token: symbol;
  inject?: any[];
  imports?: any[];
  useFactory: (...args: any[]) => Omit<KyselyModuleOptions, 'token'> | Promise<Omit<KyselyModuleOptions, 'token'>>;
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
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    KyselyModule.pools.push(pool);

    const dialect = new PostgresDialect({ pool });
    const db = new Kysely<T>({ dialect });

    return {
      module: KyselyModule,
      providers: [{ provide: options.token, useValue: db }],
      exports: [options.token],
    };
  }

  static forFeatureAsync<T>(asyncOptions: KyselyModuleAsyncOptions): DynamicModule {
    const POOL_TOKEN = Symbol(`${asyncOptions.token.description ?? 'kysely'}_pool`);

    return {
      module: KyselyModule,
      imports: asyncOptions.imports ?? [],
      providers: [
        {
          provide: POOL_TOKEN,
          inject: asyncOptions.inject ?? [],
          useFactory: async (...args: unknown[]) => {
            const opts = await asyncOptions.useFactory(...args);
            const pool = new Pool({
              host: opts.host,
              port: opts.port,
              user: opts.user,
              password: opts.password,
              database: opts.database,
              max: 10,
              idleTimeoutMillis: 30000,
              connectionTimeoutMillis: 5000,
            });
            KyselyModule.pools.push(pool);
            return pool;
          },
        },
        {
          provide: asyncOptions.token,
          inject: [POOL_TOKEN],
          useFactory: (pool: Pool) => new Kysely<T>({ dialect: new PostgresDialect({ pool }) }),
        },
      ],
      exports: [asyncOptions.token],
    };
  }

  async onModuleDestroy(): Promise<void> {
    for (const pool of KyselyModule.pools) {
      await pool.end();
    }
  }
}
