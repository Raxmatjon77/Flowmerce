import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Consumer, Kafka, EachMessagePayload, Producer } from 'kafkajs';
import { KAFKA_CLIENT } from './kafka.constants';

export interface ConsumeOptions {
  topic: string;
  groupId: string;
  handler: (payload: { key: string; value: Record<string, unknown>; headers: Record<string, string | undefined> }) => Promise<void>;
  deadLetterTopic?: string;
  maxRetries?: number;
}

@Injectable()
export class KafkaConsumerService implements OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private consumers: Consumer[] = [];
  private producer: Producer | null = null;
  private producerConnectPromise: Promise<void> | null = null;

  constructor(@Inject(KAFKA_CLIENT) private readonly kafka: Kafka) {}

  async consume(options: ConsumeOptions): Promise<void> {
    const consumer = this.kafka.consumer({ groupId: options.groupId });
    this.consumers.push(consumer);

    await consumer.connect();
    await consumer.subscribe({
      topic: options.topic,
      fromBeginning: false
    });

    await consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        const { message } = payload;
        const key = message.key?.toString() ?? '';
        const rawValue = message.value?.toString() ?? '{}';
        const parsed = this.safeJsonParse(rawValue);
        const headers: Record<string, string | undefined> = {};

        if (message.headers) {
          for (const [k, v] of Object.entries(message.headers)) {
            headers[k] = v?.toString();
          }
        }

        const retryCount = parseInt(headers['x-retry-count'] ?? '0', 10);
        const maxRetries = options.maxRetries ?? 3;

        if (!parsed.ok) {
          this.logger.error(
            `Invalid JSON message on ${options.topic}; sending to DLQ (if configured)`,
          );
          if (options.deadLetterTopic) {
            await this.sendToTopic(
              options.deadLetterTopic,
              key,
              { rawValue },
              {
                ...headers,
                'x-original-topic': options.topic,
                'x-error': 'Invalid JSON payload',
                'x-retry-count': String(retryCount),
              },
            );
          }
          return;
        }

        const value = parsed.value;

        try {
          await options.handler({ key, value, headers });
        } catch (error) {
          this.logger.error(
            `Error processing message from ${options.topic}: ${error}`,
          );

          const errorMessage = error instanceof Error ? error.message : String(error);
          const nextRetryCount = retryCount + 1;

          if (nextRetryCount > maxRetries) {
            if (options.deadLetterTopic) {
              this.logger.warn(`Sending message to DLQ: ${options.deadLetterTopic}`);
              await this.sendToTopic(options.deadLetterTopic, key, value, {
                ...headers,
                'x-original-topic': options.topic,
                'x-error': errorMessage,
                'x-retry-count': String(retryCount),
              });
            }
            return;
          }

          // Re-queue to the same topic with an incremented retry count.
          // This commits the current offset (because we swallow the error) but preserves at-least-once
          // processing via retries + idempotency.
          await this.sendToTopic(options.topic, key, value, {
            ...headers,
            'x-retry-count': String(nextRetryCount),
            'x-last-error': errorMessage,
          });
        }
      },
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnectAll();
  }

  async disconnectAll(): Promise<void> {
    for (const consumer of this.consumers) {
      await consumer.disconnect();
    }

    if (this.producer) {
      await this.producer.disconnect();
      this.producer = null;
      this.producerConnectPromise = null;
    }
  }

  private safeJsonParse(
    input: string,
  ): { ok: true; value: Record<string, unknown> } | { ok: false } {
    try {
      const parsed = JSON.parse(input);
      if (parsed && typeof parsed === 'object') {
        return { ok: true, value: parsed as Record<string, unknown> };
      }
      return { ok: true, value: { value: parsed } as Record<string, unknown> };
    } catch {
      return { ok: false };
    }
  }

  private async sendToTopic(
    topic: string,
    key: string,
    value: Record<string, unknown>,
    headers: Record<string, string | undefined>,
  ): Promise<void> {
    if (!this.producer) {
      this.producer = this.kafka.producer();
    }

    if (!this.producerConnectPromise) {
      this.producerConnectPromise = this.producer.connect();
    }
    await this.producerConnectPromise;

    await this.producer.send({
      topic,
      messages: [
        {
          key,
          value: JSON.stringify(value),
          headers,
        },
      ],
    });
  }
}
