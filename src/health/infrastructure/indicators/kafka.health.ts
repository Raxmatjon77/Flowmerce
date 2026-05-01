import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { Kafka, logLevel } from 'kafkajs';

@Injectable()
export class KafkaHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(KafkaHealthIndicator.name);
  private readonly kafka: Kafka;
  private readonly brokers: string[];

  constructor(config: ConfigService) {
    super();
    this.brokers = config.get<string[]>('kafka.brokers')!;
    this.kafka = new Kafka({
      clientId: 'health-check',
      brokers: this.brokers,
      connectionTimeout: 5000,
      logLevel: logLevel.NOTHING,
    });
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const startTime = Date.now();
    const admin = this.kafka.admin();

    try {
      await admin.connect();
      const clusterInfo = await admin.describeCluster();
      return this.getStatus(key, true, {
        brokers: this.brokers,
        clusterId: clusterInfo.clusterId,
        brokerCount: clusterInfo.brokers.length,
        responseTime: `${Date.now() - startTime}ms`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Kafka health check failed: ${message}`);
      throw new HealthCheckError(
        'Kafka check failed',
        this.getStatus(key, false, { brokers: this.brokers, message }),
      );
    } finally {
      try {
        await admin.disconnect();
      } catch {
        // ignore disconnect errors
      }
    }
  }
}
