import { Injectable } from '@nestjs/common';
import {
  IInventoryServicePort,
  InventoryReservationItem,
} from '@order/application/ports/inventory-service.port';
import { ReserveInventoryUseCase } from '@inventory/application/use-cases/reserve-inventory/reserve-inventory.use-case';
import { ReleaseInventoryUseCase } from '@inventory/application/use-cases/release-inventory/release-inventory.use-case';

@Injectable()
export class InventoryServiceAdapter implements IInventoryServicePort {
  constructor(
    private readonly reserveInventoryUseCase: ReserveInventoryUseCase,
    private readonly releaseInventoryUseCase: ReleaseInventoryUseCase,
  ) {}

  async reserveInventory(
    orderId: string,
    items: InventoryReservationItem[],
  ): Promise<void> {
    await this.reserveInventoryUseCase.execute({
      orderId,
      items: items.map((item) => ({
        sku: item.productId,
        quantity: item.quantity,
      })),
    });
  }

  async releaseInventory(
    orderId: string,
    items: InventoryReservationItem[],
  ): Promise<void> {
    await this.releaseInventoryUseCase.execute({
      orderId,
      items: items.map((item) => ({
        sku: item.productId,
        quantity: item.quantity,
      })),
    });
  }
}
