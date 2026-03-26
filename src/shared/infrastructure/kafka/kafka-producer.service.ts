import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { KAFKA_CLIENT } from './kafka.module';

export interface KafkaMessage {
  topic: string;
  key: string;
  value: Record<string, unknown>;
  headers?: Record<string, string>;
}

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private producer: Producer;

  constructor(@Inject(KAFKA_CLIENT) private readonly kafka: Kafka) {
    this.producer = this.kafka.producer();
  }

  async onModuleInit(): Promise<void> {
    await this.producer.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.producer.disconnect();
  }

  async send(message: KafkaMessage): Promise<void> {
    await this.producer.send({
      topic: message.topic,
      messages: [
        {
          key: message.key,
          value: JSON.stringify(message.value),
          headers: message.headers,
        },
      ],
    });
  }

  async sendBatch(messages: KafkaMessage[]): Promise<void> {
    await this.producer.sendBatch({
      topicMessages: messages.map((msg) => ({
        topic: msg.topic,
        messages: [
          {
            key: msg.key,
            value: JSON.stringify(msg.value),
            headers: msg.headers,
          },
        ],
      })),
    });
  }
}
