import { Module } from '@nestjs/common';
import { KyselyModule } from '@shared/infrastructure/database/kysely.module';
import {
  ShippingDatabase,
  KYSELY_SHIPPING_DB,
} from './infrastructure/database/tables/shipping.table';
import { KyselyShipmentRepository } from './infrastructure/database/repositories/shipping.repository';
import { SHIPMENT_REPOSITORY, IShipmentRepository } from '@shipping/domain';
import { EVENT_PUBLISHER, IEventPublisher } from '@shared/application';
import { ShippingEventPublisher } from './infrastructure/kafka/shipping-event-publisher';
import {
  CARRIER_SERVICE,
  ICarrierService,
} from './application/ports/carrier-service.port';
import { MockCarrierService } from './infrastructure/adapters/mock-carrier.service';
import { CreateShipmentUseCase } from './application/use-cases/create-shipment/create-shipment.use-case';
import { UpdateShipmentStatusUseCase } from './application/use-cases/update-shipment-status/update-shipment-status.use-case';
import { GetShipmentUseCase } from './application/use-cases/get-shipment/get-shipment.use-case';

@Module({
  imports: [
    KyselyModule.forFeature<ShippingDatabase>({
      host: process.env.SHIPPING_DB_HOST || 'localhost',
      port: parseInt(process.env.SHIPPING_DB_PORT || '5435', 10),
      user: process.env.SHIPPING_DB_USER || 'shipping_user',
      password: process.env.SHIPPING_DB_PASSWORD || 'shipping_pass',
      database: process.env.SHIPPING_DB_NAME || 'shipping_db',
      token: KYSELY_SHIPPING_DB,
    }),
  ],
  providers: [
    // Repository binding
    { provide: SHIPMENT_REPOSITORY, useClass: KyselyShipmentRepository },

    // Event publisher binding
    { provide: EVENT_PUBLISHER, useClass: ShippingEventPublisher },

    // Carrier service binding
    { provide: CARRIER_SERVICE, useClass: MockCarrierService },

    // Use cases (factory providers)
    {
      provide: 'CreateShipmentUseCase',
      useFactory: (
        shipmentRepository: IShipmentRepository,
        carrierService: ICarrierService,
        eventPublisher: IEventPublisher,
      ) =>
        new CreateShipmentUseCase(
          shipmentRepository,
          carrierService,
          eventPublisher,
        ),
      inject: [SHIPMENT_REPOSITORY, CARRIER_SERVICE, EVENT_PUBLISHER],
    },
    {
      provide: 'UpdateShipmentStatusUseCase',
      useFactory: (
        shipmentRepository: IShipmentRepository,
        eventPublisher: IEventPublisher,
      ) => new UpdateShipmentStatusUseCase(shipmentRepository, eventPublisher),
      inject: [SHIPMENT_REPOSITORY, EVENT_PUBLISHER],
    },
    {
      provide: 'GetShipmentUseCase',
      useFactory: (shipmentRepository: IShipmentRepository) =>
        new GetShipmentUseCase(shipmentRepository),
      inject: [SHIPMENT_REPOSITORY],
    },

    // Re-export use case classes for adapter injection
    {
      provide: CreateShipmentUseCase,
      useExisting: 'CreateShipmentUseCase',
    },
  ],
  exports: [
    SHIPMENT_REPOSITORY,
    'CreateShipmentUseCase',
    'UpdateShipmentStatusUseCase',
    'GetShipmentUseCase',
    CreateShipmentUseCase,
  ],
})
export class ShippingModule {}
