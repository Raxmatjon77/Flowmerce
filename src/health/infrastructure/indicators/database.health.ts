import { Injectable, Logger } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { Pool } from 'pg';

/**
 * Database Health Indicator
 * 
 * Checks PostgreSQL connectivity for the Order database.
 * Uses a simple SELECT 1 query to verify the connection.
 */
@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(DatabaseHealthIndicator.name);
  private pool: Pool;

  constructor() {
    super();
    this.pool = new Pool({
      host: process.env.ORDER_DB_HOST || 'localhost',
      port: parseInt(process.env.ORDER_DB_PORT || '5432', 10),
      user: process.env.ORDER_DB_USER || 'order_user',
      password: process.env.ORDER_DB_PASSWORD || 'order_pass',
      database: process.env.ORDER_DB_NAME || 'order_db',
      max: 2, // Minimal pool for health checks
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
        const responseTime = Date.now() - startTime;

        return this.getStatus(key, true, {
          responseTime: `${responseTime}ms`,
        });
      } finally {
        client.release();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Database health check failed: ${message}`);

      throw new HealthCheckError(
        'Database check failed',
        this.getStatus(key, false, {
          message,
        }),
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
