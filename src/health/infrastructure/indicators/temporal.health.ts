import { Injectable, Logger } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { Connection } from '@temporalio/client';

/**
 * Temporal Health Indicator
 * 
 * Checks connectivity to Temporal server.
 * Verifies the gRPC connection is established.
 */
@Injectable()
export class TemporalHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(TemporalHealthIndicator.name);
  private readonly address: string;

  constructor() {
    super();
    this.address = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const startTime = Date.now();
    let connection: Connection | null = null;

    try {
      connection = await Connection.connect({
        address: this.address,
        connectTimeout: 5000,
      });

      const responseTime = Date.now() - startTime;

      return this.getStatus(key, true, {
        address: this.address,
        responseTime: `${responseTime}ms`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Temporal health check failed: ${message}`);

      throw new HealthCheckError(
        'Temporal check failed',
        this.getStatus(key, false, {
          address: this.address,
          message,
        }),
      );
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  }
}
