import { DynamicModule, Module } from '@nestjs/common';
import { KafkaProducerService } from './kafka-producer.service';
import { KafkaConsumerService } from './kafka-consumer.service';
import { KafkaTopicService } from './kafka-topic.service';
import { Kafka } from 'kafkajs';
import { KAFKA_CLIENT } from './kafka.constants';
import { OutboxPublisherService } from './outbox/outbox-publisher.service';

export interface KafkaModuleOptions {
  brokers: string[];
  clientId: string;
}

export interface KafkaModuleAsyncOptions {
  inject?: any[];
  imports?: any[];
  useFactory: (...args: any[]) => KafkaModuleOptions | Promise<KafkaModuleOptions>;
}

const KAFKA_SHARED_PROVIDERS = [
  KafkaTopicService,
  KafkaProducerService,
  KafkaConsumerService,
  OutboxPublisherService,
];

const KAFKA_SHARED_EXPORTS = [
  KAFKA_CLIENT,
  KafkaProducerService,
  KafkaConsumerService,
  KafkaTopicService,
  OutboxPublisherService,
];

@Module({})
export class KafkaModule {
  static forRoot(options: KafkaModuleOptions): DynamicModule {
    const kafka = new Kafka({ clientId: options.clientId, brokers: options.brokers });

    return {
      module: KafkaModule,
      global: true,
      providers: [{ provide: KAFKA_CLIENT, useValue: kafka }, ...KAFKA_SHARED_PROVIDERS],
      exports: KAFKA_SHARED_EXPORTS,
    };
  }

  static forRootAsync(asyncOptions: KafkaModuleAsyncOptions): DynamicModule {
    return {
      module: KafkaModule,
      global: true,
      imports: asyncOptions.imports ?? [],
      providers: [
        {
          provide: KAFKA_CLIENT,
          inject: asyncOptions.inject ?? [],
          useFactory: async (...args: unknown[]) => {
            const opts = await asyncOptions.useFactory(...args);
            return new Kafka({ clientId: opts.clientId, brokers: opts.brokers });
          },
        },
        ...KAFKA_SHARED_PROVIDERS,
      ],
      exports: KAFKA_SHARED_EXPORTS,
    };
  }
}
