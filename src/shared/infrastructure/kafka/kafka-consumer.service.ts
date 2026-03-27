import { Inject, Injectable, Logger } from '@nestjs/common';
import { Consumer, Kafka, EachMessagePayload } from 'kafkajs';
import { KAFKA_CLIENT } from './kafka.constants';

export interface ConsumeOptions {
  topic: string;
  groupId: string;
  handler: (payload: { key: string; value: Record<string, unknown>; headers: Record<string, string | undefined> }) => Promise<void>;
  deadLetterTopic?: string;
  maxRetries?: number;
}

@Injectable()
export class KafkaConsumerService {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private consumers: Consumer[] = [];

  constructor(@Inject(KAFKA_CLIENT) private readonly kafka: Kafka) {}

  async consume(options: ConsumeOptions): Promise<void> {
    const consumer = this.kafka.consumer({ groupId: options.groupId });
    this.consumers.push(consumer);

    await consumer.connect();
    await consumer.subscribe({ topic: options.topic, fromBeginning: false });

    await consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        const { message } = payload;
        const key = message.key?.toString() ?? '';
        const value = JSON.parse(message.value?.toString() ?? '{}');
        const headers: Record<string, string | undefined> = {};

        if (message.headers) {
          for (const [k, v] of Object.entries(message.headers)) {
            headers[k] = v?.toString();
          }
        }

        const retryCount = parseInt(headers['x-retry-count'] ?? '0', 10);

        try {
          await options.handler({ key, value, headers });
        } catch (error) {
          this.logger.error(
            `Error processing message from ${options.topic}: ${error}`,
          );

          if (retryCount >= (options.maxRetries ?? 3) && options.deadLetterTopic) {
            this.logger.warn(`Sending message to DLQ: ${options.deadLetterTopic}`);
            const producer = this.kafka.producer();
            await producer.connect();
            await producer.send({
              topic: options.deadLetterTopic,
              messages: [
                {
                  key,
                  value: JSON.stringify(value),
                  headers: {
                    ...headers,
                    'x-original-topic': options.topic,
                    'x-error': String(error),
                  },
                },
              ],
            });
            await producer.disconnect();
          }
        }
      },
    });
  }

  async disconnectAll(): Promise<void> {
    for (const consumer of this.consumers) {
      await consumer.disconnect();
    }
  }
}
