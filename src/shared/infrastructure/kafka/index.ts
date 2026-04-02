export { KafkaModule } from './kafka.module';
export {
  KAFKA_CLIENT,
  KAFKA_TOPICS,
  dlqTopic,
  CONSUMER_GROUPS,
  OrderEventType,
  PaymentEventType,
  InventoryEventType,
  ShippingEventType,
  NotificationEventType,
  IDEMPOTENCY_PREFIXES,
  DEFAULT_MAX_RETRIES,
} from './kafka.constants';
export { KafkaProducerService, KafkaMessage } from './kafka-producer.service';
export { KafkaConsumerService, ConsumeOptions } from './kafka-consumer.service';
export { BaseEventConsumer, type EventHandler } from './base-event-consumer';
export { OutboxPublisherService, OutboxEvent, OutboxTable } from './outbox/outbox-publisher.service';
