import { DynamicModule, Module } from '@nestjs/common';
import { Client, Connection } from '@temporalio/client';

export const TEMPORAL_CLIENT = Symbol('TEMPORAL_CLIENT');

export interface TemporalModuleOptions {
  address: string;
  namespace: string;
}

@Module({})
export class TemporalModule {
  static async forRoot(options: TemporalModuleOptions): Promise<DynamicModule> {
    const connection = await Connection.connect({
      address: options.address,
    });

    const client = new Client({
      connection,
      namespace: options.namespace,
    });

    return {
      module: TemporalModule,
      global: true,
      providers: [
        {
          provide: TEMPORAL_CLIENT,
          useValue: client,
        },
      ],
      exports: [TEMPORAL_CLIENT],
    };
  }
}
