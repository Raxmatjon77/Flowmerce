import { DynamicModule, Module } from '@nestjs/common';
import { Client, Connection } from '@temporalio/client';

export const TEMPORAL_CLIENT = Symbol('TEMPORAL_CLIENT');

export interface TemporalModuleOptions {
  address: string;
  namespace: string;
}

export interface TemporalModuleAsyncOptions {
  inject?: any[];
  imports?: any[];
  useFactory: (...args: any[]) => TemporalModuleOptions | Promise<TemporalModuleOptions>;
}

@Module({})
export class TemporalModule {
  static async forRoot(options: TemporalModuleOptions): Promise<DynamicModule> {
    const connection = await Connection.connect({ address: options.address });
    const client = new Client({ connection, namespace: options.namespace });

    return {
      module: TemporalModule,
      global: true,
      providers: [{ provide: TEMPORAL_CLIENT, useValue: client }],
      exports: [TEMPORAL_CLIENT],
    };
  }

  static forRootAsync(asyncOptions: TemporalModuleAsyncOptions): DynamicModule {
    return {
      module: TemporalModule,
      global: true,
      imports: asyncOptions.imports ?? [],
      providers: [
        {
          provide: TEMPORAL_CLIENT,
          inject: asyncOptions.inject ?? [],
          useFactory: async (...args: unknown[]) => {
            const opts = await asyncOptions.useFactory(...args);
            const connection = await Connection.connect({ address: opts.address });
            return new Client({ connection, namespace: opts.namespace });
          },
        },
      ],
      exports: [TEMPORAL_CLIENT],
    };
  }
}
