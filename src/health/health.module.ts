import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './presentation/controllers/health.controller';
import { DatabaseHealthIndicator } from './infrastructure/indicators/database.health';
import { TemporalHealthIndicator } from './infrastructure/indicators/temporal.health';
import { KafkaHealthIndicator } from './infrastructure/indicators/kafka.health';

/**
 * Health Module
 * 
 * Provides health check endpoints for:
 * - Kubernetes liveness/readiness probes
 * - Load balancer health checks
 * - Monitoring systems
 * 
 * Endpoints:
 * - GET /health          - Full health check (all dependencies)
 * - GET /health/live     - Liveness probe (is the process alive?)
 * - GET /health/ready    - Readiness probe (can it accept traffic?)
 */
@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [
    DatabaseHealthIndicator,
    TemporalHealthIndicator,
    KafkaHealthIndicator,
  ],
})
export class HealthModule {}
