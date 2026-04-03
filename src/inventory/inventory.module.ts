import { Module } from '@nestjs/common';
import { IdempotencyModule } from '@shared/infrastructure/idempotency';
import { KyselyModule } from '@shared/infrastructure/database/kysely.module';
import {
  InventoryDatabase,
  KYSELY_INVENTORY_DB,
} from './infrastructure/database/tables/inventory.table';
import { KyselyInventoryRepository } from './infrastructure/database/repositories/inventory.repository';
import { INVENTORY_REPOSITORY, IInventoryRepository } from '@inventory/domain';
import { EVENT_PUBLISHER, IEventPublisher } from '@shared/application';
import { InventoryEventPublisher } from './infrastructure/kafka/inventory-event-publisher';
import { ReserveInventoryUseCase } from './application/use-cases/reserve-inventory/reserve-inventory.use-case';
import { ReleaseInventoryUseCase } from './application/use-cases/release-inventory/release-inventory.use-case';
import { DeductInventoryUseCase } from './application/use-cases/deduct-inventory/deduct-inventory.use-case';
import { GetInventoryUseCase } from './application/use-cases/get-inventory/get-inventory.use-case';
import { INVENTORY_USE_CASE_TOKENS } from './application/injection-tokens';
import { InventoryEventConsumer } from './infrastructure/kafka/inventory-event-consumer';
import { InventoryController } from './presentation/controllers/inventory.controller';

@Module({
  imports: [
    IdempotencyModule,
    KyselyModule.forFeature<InventoryDatabase>({
      host: process.env.INVENTORY_DB_HOST || 'localhost',
      port: parseInt(process.env.INVENTORY_DB_PORT || '5434', 10),
      user: process.env.INVENTORY_DB_USER || 'inventory_user',
      password: process.env.INVENTORY_DB_PASSWORD || 'inventory_pass',
      database: process.env.INVENTORY_DB_NAME || 'inventory_db',
      token: KYSELY_INVENTORY_DB,
    }),
  ],
  controllers: [InventoryController],
  providers: [
    // Repository binding
    { provide: INVENTORY_REPOSITORY, useClass: KyselyInventoryRepository },

    // Event publisher binding
    { provide: EVENT_PUBLISHER, useClass: InventoryEventPublisher },

    // Use cases (factory providers)
    {
      provide: INVENTORY_USE_CASE_TOKENS.RESERVE,
      useFactory: (
        inventoryRepository: IInventoryRepository,
        eventPublisher: IEventPublisher,
      ) => new ReserveInventoryUseCase(inventoryRepository, eventPublisher),
      inject: [INVENTORY_REPOSITORY, EVENT_PUBLISHER],
    },
    {
      provide: INVENTORY_USE_CASE_TOKENS.RELEASE,
      useFactory: (
        inventoryRepository: IInventoryRepository,
        eventPublisher: IEventPublisher,
      ) => new ReleaseInventoryUseCase(inventoryRepository, eventPublisher),
      inject: [INVENTORY_REPOSITORY, EVENT_PUBLISHER],
    },
    {
      provide: INVENTORY_USE_CASE_TOKENS.DEDUCT,
      useFactory: (
        inventoryRepository: IInventoryRepository,
        eventPublisher: IEventPublisher,
      ) => new DeductInventoryUseCase(inventoryRepository, eventPublisher),
      inject: [INVENTORY_REPOSITORY, EVENT_PUBLISHER],
    },
    {
      provide: INVENTORY_USE_CASE_TOKENS.GET,
      useFactory: (inventoryRepository: IInventoryRepository) =>
        new GetInventoryUseCase(inventoryRepository),
      inject: [INVENTORY_REPOSITORY],
    },

    // Re-export use case classes for adapter injection
    {
      provide: ReserveInventoryUseCase,
      useExisting: INVENTORY_USE_CASE_TOKENS.RESERVE,
    },
    {
      provide: ReleaseInventoryUseCase,
      useExisting: INVENTORY_USE_CASE_TOKENS.RELEASE,
    },

    // Kafka event consumer
    InventoryEventConsumer,
  ],
  exports: [
    INVENTORY_REPOSITORY,
    INVENTORY_USE_CASE_TOKENS.RESERVE,
    INVENTORY_USE_CASE_TOKENS.RELEASE,
    INVENTORY_USE_CASE_TOKENS.DEDUCT,
    INVENTORY_USE_CASE_TOKENS.GET,
    ReserveInventoryUseCase,
    ReleaseInventoryUseCase,
  ],
})
export class InventoryModule {}
