import { Injectable } from '@nestjs/common';
import { HealthCheckError } from '@nestjs/terminus';
import { DatabaseHealthIndicator } from '../../../health/infrastructure/indicators/database.health';
import { KafkaHealthIndicator } from '../../../health/infrastructure/indicators/kafka.health';
import { TemporalHealthIndicator } from '../../../health/infrastructure/indicators/temporal.health';
import {
  DashboardDependencyHealth,
  IDashboardHealthPort,
} from '../../application/ports/dashboard-health.port';

@Injectable()
export class DashboardHealthAdapter implements IDashboardHealthPort {
  constructor(
    private readonly databaseHealth: DatabaseHealthIndicator,
    private readonly kafkaHealth: KafkaHealthIndicator,
    private readonly temporalHealth: TemporalHealthIndicator,
  ) {}

  async checkDependencies(): Promise<DashboardDependencyHealth[]> {
    return Promise.all([
      this.measureHealth('Order Database', () =>
        this.databaseHealth.isHealthy('database_order'),
      ),
      this.measureHealth('Kafka', () => this.kafkaHealth.isHealthy('kafka')),
      this.measureHealth('Temporal', () => this.temporalHealth.isHealthy('temporal')),
    ]);
  }

  private async measureHealth(
    name: string,
    check: () => Promise<Record<string, unknown>>,
  ): Promise<DashboardDependencyHealth> {
    const checkedAt = new Date();

    try {
      const result = await check();
      const detail = Object.values(result)[0] as Record<string, unknown> | undefined;

      return {
        name,
        status: 'healthy',
        responseTimeMs: this.parseResponseTime(detail?.responseTime),
        details: detail ? JSON.stringify(detail) : 'Healthy',
        checkedAt,
      };
    } catch (error) {
      const detail = this.extractHealthError(error);

      return {
        name,
        status: name === 'Temporal' ? 'degraded' : 'down',
        responseTimeMs: this.parseResponseTime(detail.responseTime),
        details: detail.message,
        checkedAt,
      };
    }
  }

  private extractHealthError(error: unknown): {
    message: string;
    responseTime?: unknown;
  } {
    if (error instanceof HealthCheckError) {
      const causes = Object.values(error.causes);
      const firstCause = causes[0] as Record<string, unknown> | undefined;

      return {
        message:
          typeof firstCause?.message === 'string'
            ? firstCause.message
            : error.message,
        responseTime: firstCause?.responseTime,
      };
    }

    if (error instanceof Error) {
      return { message: error.message };
    }

    return { message: 'Unknown health check error' };
  }

  private parseResponseTime(responseTime: unknown): number | null {
    if (typeof responseTime === 'string' && responseTime.endsWith('ms')) {
      const value = Number.parseInt(responseTime.replace('ms', ''), 10);
      return Number.isNaN(value) ? null : value;
    }

    return null;
  }
}
