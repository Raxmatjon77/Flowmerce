import { registerAs } from '@nestjs/config';

export interface KafkaConfig {
  brokers: string[];
  clientId: string;
}

export const kafkaConfig = registerAs('kafka', (): KafkaConfig => ({
  brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(',').map((b) => b.trim()),
  clientId: process.env.KAFKA_CLIENT_ID ?? 'distributed-order-platform',
}));
