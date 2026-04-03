import { Module } from '@nestjs/common';
import { IdempotencyModule } from '@shared/infrastructure/idempotency';
import { KyselyModule } from '@shared/infrastructure/database/kysely.module';
import { PaymentDatabase } from './infrastructure/database/tables/payment.table';
import {
  KyselyPaymentRepository,
  KYSELY_PAYMENT_DB,
} from './infrastructure/database/repositories/payment.repository';
import { PAYMENT_REPOSITORY, IPaymentRepository } from '@payment/domain';
import { EVENT_PUBLISHER, IEventPublisher } from '@shared/application';
import { PaymentEventPublisher } from './infrastructure/kafka/payment-event-publisher';
import {
  PAYMENT_GATEWAY,
  IPaymentGateway,
} from './application/ports/payment-gateway.port';
import { MockPaymentGateway } from './infrastructure/adapters/mock-payment-gateway';
import { ProcessPaymentUseCase } from './application/use-cases/process-payment/process-payment.use-case';
import { RefundPaymentUseCase } from './application/use-cases/refund-payment/refund-payment.use-case';
import { GetPaymentUseCase } from './application/use-cases/get-payment/get-payment.use-case';
import { PAYMENT_USE_CASE_TOKENS } from './application/injection-tokens';
import { PaymentEventConsumer } from './infrastructure/kafka/payment-event-consumer';
import { PaymentController } from './presentation/controllers/payment.controller';

@Module({
  imports: [
    IdempotencyModule,
    KyselyModule.forFeature<PaymentDatabase>({
      host: process.env.PAYMENT_DB_HOST || 'localhost',
      port: parseInt(process.env.PAYMENT_DB_PORT || '5433', 10),
      user: process.env.PAYMENT_DB_USER || 'payment_user',
      password: process.env.PAYMENT_DB_PASSWORD || 'payment_pass',
      database: process.env.PAYMENT_DB_NAME || 'payment_db',
      token: KYSELY_PAYMENT_DB,
    }),
  ],
  controllers: [PaymentController],
  providers: [
    // Repository binding
    { provide: PAYMENT_REPOSITORY, useClass: KyselyPaymentRepository },

    // Event publisher binding
    { provide: EVENT_PUBLISHER, useClass: PaymentEventPublisher },

    // Payment gateway binding
    { provide: PAYMENT_GATEWAY, useClass: MockPaymentGateway },

    // Use cases (factory providers)
    {
      provide: PAYMENT_USE_CASE_TOKENS.PROCESS,
      useFactory: (
        paymentRepository: IPaymentRepository,
        paymentGateway: IPaymentGateway,
        eventPublisher: IEventPublisher,
      ) =>
        new ProcessPaymentUseCase(
          paymentRepository,
          paymentGateway,
          eventPublisher,
        ),
      inject: [PAYMENT_REPOSITORY, PAYMENT_GATEWAY, EVENT_PUBLISHER],
    },
    {
      provide: PAYMENT_USE_CASE_TOKENS.REFUND,
      useFactory: (
        paymentRepository: IPaymentRepository,
        eventPublisher: IEventPublisher,
      ) => new RefundPaymentUseCase(paymentRepository, eventPublisher),
      inject: [PAYMENT_REPOSITORY, EVENT_PUBLISHER],
    },
    {
      provide: PAYMENT_USE_CASE_TOKENS.GET,
      useFactory: (paymentRepository: IPaymentRepository) =>
        new GetPaymentUseCase(paymentRepository),
      inject: [PAYMENT_REPOSITORY],
    },

    // Re-export use case classes for adapter injection (used by order service adapters)
    {
      provide: ProcessPaymentUseCase,
      useExisting: PAYMENT_USE_CASE_TOKENS.PROCESS,
    },
    {
      provide: RefundPaymentUseCase,
      useExisting: PAYMENT_USE_CASE_TOKENS.REFUND,
    },

    // Kafka event consumer
    PaymentEventConsumer,
  ],
  exports: [
    PAYMENT_REPOSITORY,
    PAYMENT_USE_CASE_TOKENS.PROCESS,
    PAYMENT_USE_CASE_TOKENS.REFUND,
    PAYMENT_USE_CASE_TOKENS.GET,
    ProcessPaymentUseCase,
    RefundPaymentUseCase,
  ],
})
export class PaymentModule {}
