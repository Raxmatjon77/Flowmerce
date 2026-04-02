import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  HealthCheckResult,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '@shared/infrastructure/auth';
import { DatabaseHealthIndicator } from '../../infrastructure/indicators/database.health';
import { TemporalHealthIndicator } from '../../infrastructure/indicators/temporal.health';
import { KafkaHealthIndicator } from '../../infrastructure/indicators/kafka.health';

@ApiTags('Health')
@Public()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly database: DatabaseHealthIndicator,
    private readonly temporal: TemporalHealthIndicator,
    private readonly kafka: KafkaHealthIndicator,
  ) {}

  /**
   * Full health check - checks all dependencies
   * Use for monitoring dashboards
   */
  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      // System checks
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024), // 300MB
      () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024), // 500MB
      
      // Infrastructure checks
      () => this.database.isHealthy('database_order'),
      () => this.temporal.isHealthy('temporal'),
      () => this.kafka.isHealthy('kafka'),
    ]);
  }

  /**
   * Liveness probe - is the process alive and not deadlocked?
   * Kubernetes uses this to know when to restart the container
   * Should be fast and not check external dependencies
   */
  @Get('live')
  @HealthCheck()
  async liveness(): Promise<HealthCheckResult> {
    return this.health.check([
      // Only check if the process itself is healthy
      () => this.memory.checkHeap('memory_heap', 500 * 1024 * 1024), // 500MB - generous limit
    ]);
  }

  /**
   * Readiness probe - can the service accept traffic?
   * Kubernetes uses this to know when to route traffic to the pod
   * Should check critical dependencies
   */
  @Get('ready')
  @HealthCheck()
  async readiness(): Promise<HealthCheckResult> {
    return this.health.check([
      // Check critical dependencies needed to serve requests
      () => this.database.isHealthy('database_order'),
      () => this.temporal.isHealthy('temporal'),
    ]);
  }
}
