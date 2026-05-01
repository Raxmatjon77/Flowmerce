import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { Connection } from '@temporalio/client';

@Injectable()
export class TemporalHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(TemporalHealthIndicator.name);
  private readonly address: string;

  constructor(config: ConfigService) {
    super();
    this.address = config.get<string>('temporal.address')!;
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const startTime = Date.now();
    let connection: Connection | null = null;

    try {
      connection = await Connection.connect({ address: this.address, connectTimeout: 5000 });
      return this.getStatus(key, true, {
        address: this.address,
        responseTime: `${Date.now() - startTime}ms`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Temporal health check failed: ${message}`);
      throw new HealthCheckError(
        'Temporal check failed',
        this.getStatus(key, false, { address: this.address, message }),
      );
    } finally {
      if (connection) await connection.close();
    }
  }
}
