import { Injectable, Logger } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { Kafka, logLevel } from 'kafkajs';

/**
 * Kafka Health Indicator
 * 
 * Checks connectivity to Kafka brokers.
 * Uses admin client to fetch cluster metadata.
 */
@Injectable()
export class KafkaHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(KafkaHealthIndicator.name);
  private readonly kafka: Kafka;
  private readonly brokers: string[];

  constructor() {
    super();
    this.brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
    this.kafka = new Kafka({
      clientId: 'health-check',
      brokers: this.brokers,
      connectionTimeout: 5000,
      logLevel: logLevel.NOTHING, // Suppress Kafka logs during health check
    });
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const startTime = Date.now();
    const admin = this.kafka.admin();

    try {
      await admin.connect();
      
      const clusterInfo = await admin.describeCluster();
      const responseTime = Date.now() - startTime;

      return this.getStatus(key, true, {
        brokers: this.brokers,
        clusterId: clusterInfo.clusterId,
        brokerCount: clusterInfo.brokers.length,
        responseTime: `${responseTime}ms`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Kafka health check failed: ${message}`);

      throw new HealthCheckError(
        'Kafka check failed',
        this.getStatus(key, false, {
          brokers: this.brokers,
          message,
        }),
      );
    } finally {
      try {
        await admin.disconnect();
      } catch {
        // Ignore disconnect errors
      }
    }
  }
}
