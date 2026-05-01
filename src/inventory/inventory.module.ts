import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IdempotencyModule } from '@shared/infrastructure/idempotency';
import { KyselyModule } from '@shared/infrastructure/database/kysely.module';
import { DbConfig } from '@shared/config';
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
import { ListInventoryUseCase } from './application/use-cases/list-inventory/list-inventory.use-case';
import { INVENTORY_USE_CASE_TOKENS } from './application/injection-tokens';
import { InventoryEventConsumer } from './infrastructure/kafka/inventory-event-consumer';
import { InventoryController } from './presentation/controllers/inventory.controller';
import { InventoryOutboxPollerService } from './infrastructure/kafka/inventory-outbox-poller.service';

@Module({
  imports: [
    IdempotencyModule,
    KyselyModule.forFeatureAsync<InventoryDatabase>({
      token: KYSELY_INVENTORY_DB,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get<DbConfig>('inventoryDb')!,
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
    {
      provide: INVENTORY_USE_CASE_TOKENS.LIST,
      useFactory: (inventoryRepository: IInventoryRepository) =>
        new ListInventoryUseCase(inventoryRepository),
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

    // Outbox publisher poller
    InventoryOutboxPollerService,
  ],
  exports: [
    INVENTORY_REPOSITORY,
    INVENTORY_USE_CASE_TOKENS.RESERVE,
    INVENTORY_USE_CASE_TOKENS.RELEASE,
    INVENTORY_USE_CASE_TOKENS.DEDUCT,
    INVENTORY_USE_CASE_TOKENS.GET,
    INVENTORY_USE_CASE_TOKENS.LIST,
    ReserveInventoryUseCase,
    ReleaseInventoryUseCase,
  ],
})
export class InventoryModule {}
