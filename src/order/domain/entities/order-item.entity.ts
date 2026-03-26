import { Entity } from '../../../shared/domain/entity.base';
import { Money } from '../value-objects/money.value-object';

export interface OrderItemProps {
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: Money;
}

export class OrderItem extends Entity<string> {
  private readonly _orderId: string;
  private readonly _productId: string;
  private readonly _productName: string;
  private readonly _quantity: number;
  private readonly _unitPrice: Money;
  private readonly _totalPrice: Money;

  private constructor(id: string, props: OrderItemProps) {
    super(id);
    this._orderId = props.orderId;
    this._productId = props.productId;
    this._productName = props.productName;
    this._quantity = props.quantity;
    this._unitPrice = props.unitPrice;
    this._totalPrice = props.unitPrice.multiply(props.quantity);
  }

  static create(id: string, props: OrderItemProps): OrderItem {
    if (!props.productId || props.productId.trim().length === 0) {
      throw new Error('Product ID must not be empty');
    }
    if (!props.productName || props.productName.trim().length === 0) {
      throw new Error('Product name must not be empty');
    }
    if (props.quantity <= 0) {
      throw new Error(`Quantity must be positive: ${props.quantity}`);
    }
    if (!Number.isInteger(props.quantity)) {
      throw new Error(`Quantity must be an integer: ${props.quantity}`);
    }

    return new OrderItem(id, props);
  }

  static reconstitute(
    id: string,
    props: OrderItemProps,
    createdAt: Date,
    updatedAt: Date,
  ): OrderItem {
    const item = new OrderItem(id, props);
    (item as any)._createdAt = createdAt;
    (item as any)._updatedAt = updatedAt;
    return item;
  }

  get orderId(): string {
    return this._orderId;
  }

  get productId(): string {
    return this._productId;
  }

  get productName(): string {
    return this._productName;
  }

  get quantity(): number {
    return this._quantity;
  }

  get unitPrice(): Money {
    return this._unitPrice;
  }

  get totalPrice(): Money {
    return this._totalPrice;
  }
}
