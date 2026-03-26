import { IUseCase, IEventPublisher } from '@shared/application';
import {
  IInventoryRepository,
  Sku,
  InventoryNotFoundError,
} from '@inventory/domain';
import { ReserveInventoryDto } from '../../dtos/reserve-inventory.dto';

export class ReserveInventoryUseCase
  implements IUseCase<ReserveInventoryDto, void>
{
  constructor(
    private readonly inventoryRepository: IInventoryRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(input: ReserveInventoryDto): Promise<void> {
    const { orderId, items } = input;

    const inventoryItems = await Promise.all(
      items.map(async (item) => {
        const sku = Sku.create(item.sku);
        const inventoryItem = await this.inventoryRepository.findBySku(sku);

        if (!inventoryItem) {
          throw new InventoryNotFoundError(item.sku);
        }

        return { inventoryItem, quantity: item.quantity };
      }),
    );

    // Reserve all items — if any throws, none should be persisted (caller handles transaction)
    for (const { inventoryItem, quantity } of inventoryItems) {
      inventoryItem.reserve(orderId, quantity);
    }

    // Persist all updated inventory items
    for (const { inventoryItem } of inventoryItems) {
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
