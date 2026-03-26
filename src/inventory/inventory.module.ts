import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    KyselyModule.forFeature<InventoryDatabase>({
      host: process.env.INVENTORY_DB_HOST || 'localhost',
      port: parseInt(process.env.INVENTORY_DB_PORT || '5434', 10),
      user: process.env.INVENTORY_DB_USER || 'inventory_user',
      password: process.env.INVENTORY_DB_PASSWORD || 'inventory_pass',
      database: process.env.INVENTORY_DB_NAME || 'inventory_db',
      token: KYSELY_INVENTORY_DB,
    }),
  ],
  providers: [
    // Repository binding
    { provide: INVENTORY_REPOSITORY, useClass: KyselyInventoryRepository },

    // Event publisher binding
    { provide: EVENT_PUBLISHER, useClass: InventoryEventPublisher },

    // Use cases (factory providers)
    {
      provide: 'ReserveInventoryUseCase',
      useFactory: (
        inventoryRepository: IInventoryRepository,
        eventPublisher: IEventPublisher,
      ) => new ReserveInventoryUseCase(inventoryRepository, eventPublisher),
      inject: [INVENTORY_REPOSITORY, EVENT_PUBLISHER],
    },
    {
      provide: 'ReleaseInventoryUseCase',
      useFactory: (
        inventoryRepository: IInventoryRepository,
        eventPublisher: IEventPublisher,
      ) => new ReleaseInventoryUseCase(inventoryRepository, eventPublisher),
      inject: [INVENTORY_REPOSITORY, EVENT_PUBLISHER],
    },
    {
      provide: 'DeductInventoryUseCase',
      useFactory: (
        inventoryRepository: IInventoryRepository,
        eventPublisher: IEventPublisher,
      ) => new DeductInventoryUseCase(inventoryRepository, eventPublisher),
      inject: [INVENTORY_REPOSITORY, EVENT_PUBLISHER],
    },
    {
      provide: 'GetInventoryUseCase',
      useFactory: (inventoryRepository: IInventoryRepository) =>
        new GetInventoryUseCase(inventoryRepository),
      inject: [INVENTORY_REPOSITORY],
    },

    // Re-export use case classes for adapter injection
    {
      provide: ReserveInventoryUseCase,
      useExisting: 'ReserveInventoryUseCase',
    },
    {
      provide: ReleaseInventoryUseCase,
      useExisting: 'ReleaseInventoryUseCase',
    },
  ],
  exports: [
    INVENTORY_REPOSITORY,
    'ReserveInventoryUseCase',
    'ReleaseInventoryUseCase',
    'DeductInventoryUseCase',
    'GetInventoryUseCase',
    ReserveInventoryUseCase,
    ReleaseInventoryUseCase,
  ],
})
export class InventoryModule {}
