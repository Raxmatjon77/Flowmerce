import { DynamicModule, Module } from '@nestjs/common';
import { KafkaProducerService } from './kafka-producer.service';
import { KafkaConsumerService } from './kafka-consumer.service';
import { Kafka } from 'kafkajs';
import { KAFKA_CLIENT } from './kafka.constants';

export interface KafkaModuleOptions {
  brokers: string[];
  clientId: string;
}

@Module({})
export class KafkaModule {
  static forRoot(options: KafkaModuleOptions): DynamicModule {
    const kafka = new Kafka({
      clientId: options.clientId,
      brokers: options.brokers,
    });

    return {
      module: KafkaModule,
      global: true,
      providers: [
        {
          provide: KAFKA_CLIENT,
          useValue: kafka,
        },
        KafkaProducerService,
        KafkaConsumerService,
      ],
      exports: [KAFKA_CLIENT, KafkaProducerService, KafkaConsumerService],
    };
  }
}
