import { Injectable, OnModuleInit, Logger, Inject } from '@nestjs/common';
import { Kafka, Admin } from 'kafkajs';
import { KAFKA_TOPICS, dlqTopic, KAFKA_CLIENT } from './kafka.constants';

@Injectable()
export class KafkaTopicService implements OnModuleInit {
  private readonly admin: Admin;
  private readonly logger = new Logger(KafkaTopicService.name);
  private readonly topics = [
    KAFKA_TOPICS.ORDER_EVENTS,
    KAFKA_TOPICS.PAYMENT_EVENTS,
    KAFKA_TOPICS.INVENTORY_EVENTS,
    KAFKA_TOPICS.SHIPPING_EVENTS,
    KAFKA_TOPICS.NOTIFICATION_EVENTS,
    dlqTopic(KAFKA_TOPICS.ORDER_EVENTS),
    dlqTopic(KAFKA_TOPICS.PAYMENT_EVENTS),
    dlqTopic(KAFKA_TOPICS.INVENTORY_EVENTS),
    dlqTopic(KAFKA_TOPICS.SHIPPING_EVENTS),
    dlqTopic(KAFKA_TOPICS.NOTIFICATION_EVENTS),
  ];

  constructor(@Inject(KAFKA_CLIENT) private readonly kafka: Kafka) {
    this.admin = kafka.admin();
  }

  async onModuleInit() {
    await this.ensureTopicsExist();
  }

  private async ensureTopicsExist(): Promise<void> {
    try {
      this.logger.log('Connecting to Kafka admin to check/create topics...');
      await this.admin.connect();

      const topicMetadata = await this.admin.fetchTopicMetadata();
      const existingTopicNames = topicMetadata.topics.map((t) => t.name);
      this.logger.debug(`Existing topics: ${existingTopicNames.join(', ')}`);

      const topicsToCreate = this.topics.filter(
        (topic) => !existingTopicNames.includes(topic),
      );

      if (topicsToCreate.length > 0) {
        this.logger.log(`Creating missing topics: ${topicsToCreate.join(', ')}`);
        await this.admin.createTopics({
          topics: topicsToCreate.map((topic) => ({
            topic,
            numPartitions: 1,
            replicationFactor: 1,
          })),
        });
        this.logger.log('Topics created successfully');
      } else {
        this.logger.debug('All required topics already exist');
      }
    } catch (error) {
      this.logger.error('Failed to ensure topics exist', error);
    } finally {
      await this.admin.disconnect();
    }
  }
}