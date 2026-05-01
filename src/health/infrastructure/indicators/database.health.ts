import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { Pool } from 'pg';
import { DbConfig } from '@shared/config';

@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(DatabaseHealthIndicator.name);
  private readonly pool: Pool;

  constructor(config: ConfigService) {
    super();
    const db = config.get<DbConfig>('orderDb')!;
    this.pool = new Pool({
      host: db.host,
      port: db.port,
      user: db.user,
      password: db.password,
      database: db.database,
      max: 2,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    });
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const startTime = Date.now();

    try {
      const client = await this.pool.connect();
      try {
        await client.query('SELECT 1');
        return this.getStatus(key, true, { responseTime: `${Date.now() - startTime}ms` });
      } finally {
        client.release();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Database health check failed: ${message}`);
      throw new HealthCheckError('Database check failed', this.getStatus(key, false, { message }));
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
