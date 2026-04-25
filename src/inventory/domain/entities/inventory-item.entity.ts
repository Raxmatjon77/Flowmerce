import { AggregateRoot } from '@shared/domain';
import { Sku } from '../value-objects/sku.value-object';
import { Quantity } from '../value-objects/quantity.value-object';
import { InventoryReservedEvent } from '../events/inventory-reserved.event';
import { InventoryReleasedEvent } from '../events/inventory-released.event';
import { InventoryDeductedEvent } from '../events/inventory-deducted.event';
import { InsufficientInventoryError } from '../errors/inventory-domain.errors';

export interface InventoryItemProps {
  sku: Sku;
  productName: string;
  totalQuantity: Quantity;
  reservedQuantity: Quantity;
  unitPrice: number;
}

export class InventoryItem extends AggregateRoot {
  private _sku: Sku;
  private _productName: string;
  private _totalQuantity: Quantity;
  private _reservedQuantity: Quantity;
  private _unitPrice: number;

  private constructor(id: string, props: InventoryItemProps) {
    super(id);
    this._sku = props.sku;
    this._productName = props.productName;
    this._totalQuantity = props.totalQuantity;
    this._reservedQuantity = props.reservedQuantity;
    this._unitPrice = props.unitPrice;
  }

  static create(
    id: string,
    sku: Sku,
    productName: string,
    totalQuantity: Quantity,
    unitPrice: number,
  ): InventoryItem {
    return new InventoryItem(id, {
      sku,
      productName,
      totalQuantity,
      reservedQuantity: Quantity.create(0),
      unitPrice,
    });
  }

  static reconstitute(id: string, props: InventoryItemProps): InventoryItem {
    return new InventoryItem(id, props);
  }

  get sku(): Sku {
    return this._sku;
  }

  get productName(): string {
    return this._productName;
  }

  get totalQuantity(): Quantity {
    return this._totalQuantity;
  }

  get reservedQuantity(): Quantity {
    return this._reservedQuantity;
  }

  get unitPrice(): number {
    return this._unitPrice;
  }

  get availableQuantity(): Quantity {
    return this._totalQuantity.subtract(this._reservedQuantity);
  }

  reserve(orderId: string, quantity: number): void {
    const available = this.availableQuantity;

    if (!available.isAvailable(quantity)) {
      throw new InsufficientInventoryError(
        this.id,
        quantity,
        available.value,
      );
    }

    this._reservedQuantity = this._reservedQuantity.add(
      Quantity.create(quantity),
    );
    this._updatedAt = new Date();

    this.addDomainEvent(
      new InventoryReservedEvent(this.id, orderId, quantity),
    );
  }

  release(orderId: string, quantity: number): void {
    if (quantity > this._reservedQuantity.value) {
      throw new Error(
        `Cannot release ${quantity} units: only ${this._reservedQuantity.value} reserved`,
      );
    }

    this._reservedQuantity = this._reservedQuantity.subtract(
      Quantity.create(quantity),
    );
    this._updatedAt = new Date();

    this.addDomainEvent(
      new InventoryReleasedEvent(this.id, orderId, quantity),
    );
  }

  deduct(quantity: number): void {
    const qty = Quantity.create(quantity);

    if (quantity > this._totalQuantity.value) {
      throw new Error(
        `Cannot deduct ${quantity} units: only ${this._totalQuantity.value} total`,
      );
    }

    this._totalQuantity = this._totalQuantity.subtract(qty);
    this._updatedAt = new Date();

    this.addDomainEvent(new InventoryDeductedEvent(this.id, quantity));
  }
}
