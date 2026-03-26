import { IUseCase, IEventPublisher } from '@shared/application';
import {
  IInventoryRepository,
  Sku,
  InventoryNotFoundError,
} from '@inventory/domain';

export interface DeductInventoryInput {
  sku: string;
  quantity: number;
}

export class DeductInventoryUseCase
  implements IUseCase<DeductInventoryInput, void>
{
  constructor(
    private readonly inventoryRepository: IInventoryRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(input: DeductInventoryInput): Promise<void> {
    const sku = Sku.create(input.sku);
    const inventoryItem = await this.inventoryRepository.findBySku(sku);

    if (!inventoryItem) {
      throw new InventoryNotFoundError(input.sku);
    }

    inventoryItem.deduct(input.quantity);

    await this.inventoryRepository.updateQuantities(
      inventoryItem.id,
      inventoryItem.totalQuantity,
      inventoryItem.reservedQuantity,
    );

    const events = inventoryItem.clearDomainEvents();
    await this.eventPublisher.publishAll(events);
  }
}
