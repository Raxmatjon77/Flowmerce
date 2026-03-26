import { IUseCase, IEventPublisher } from '@shared/application';
import {
  IInventoryRepository,
  Sku,
  InventoryNotFoundError,
} from '@inventory/domain';
import { ReleaseInventoryDto } from '../../dtos/release-inventory.dto';

export class ReleaseInventoryUseCase
  implements IUseCase<ReleaseInventoryDto, void>
{
  constructor(
    private readonly inventoryRepository: IInventoryRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(input: ReleaseInventoryDto): Promise<void> {
    const { orderId, items } = input;

    for (const item of items) {
      const sku = Sku.create(item.sku);
      const inventoryItem = await this.inventoryRepository.findBySku(sku);

      if (!inventoryItem) {
        throw new InventoryNotFoundError(item.sku);
      }

      inventoryItem.release(orderId, item.quantity);

      await this.inventoryRepository.updateQuantities(
        inventoryItem.id,
        inventoryItem.totalQuantity,
        inventoryItem.reservedQuantity,
      );

      const events = inventoryItem.clearDomainEvents();
      await this.eventPublisher.publishAll(events);
    }
  }
}
