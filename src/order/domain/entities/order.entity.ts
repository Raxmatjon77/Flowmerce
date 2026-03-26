import { AggregateRoot } from '../../../shared/domain/aggregate-root.base';
import { Money } from '../value-objects/money.value-object';
import { OrderStatus } from '../value-objects/order-status.value-object';
import { ShippingAddress } from '../value-objects/shipping-address.value-object';
import { OrderItem } from './order-item.entity';
import { OrderCreatedEvent } from '../events/order-created.event';
import { OrderInventoryReservedEvent } from '../events/order-inventory-reserved.event';
import { OrderPaymentProcessedEvent } from '../events/order-payment-processed.event';
import { OrderConfirmedEvent } from '../events/order-confirmed.event';
import { OrderCancelledEvent } from '../events/order-cancelled.event';
import { OrderShippedEvent } from '../events/order-shipped.event';
import {
  InvalidOrderTransitionError,
  InvalidOrderError,
} from '../errors/order-domain.errors';

export interface OrderProps {
  customerId: string;
  items: OrderItem[];
  status: OrderStatus;
  shippingAddress: ShippingAddress;
  totalAmount: Money;
}

export class Order extends AggregateRoot<string> {
  private readonly _customerId: string;
  private readonly _items: OrderItem[];
  private _status: OrderStatus;
  private readonly _shippingAddress: ShippingAddress;
  private readonly _totalAmount: Money;

  private constructor(id: string, props: OrderProps) {
    super(id);
    this._customerId = props.customerId;
    this._items = [...props.items];
    this._status = props.status;
    this._shippingAddress = props.shippingAddress;
    this._totalAmount = props.totalAmount;
  }

  static create(
    id: string,
    customerId: string,
    items: OrderItem[],
    shippingAddress: ShippingAddress,
    currency: string,
  ): Order {
    if (!customerId || customerId.trim().length === 0) {
      throw new InvalidOrderError('Customer ID must not be empty');
    }
    if (items.length === 0) {
      throw new InvalidOrderError('Order must contain at least one item');
    }

    const totalAmount = items.reduce(
      (sum, item) => sum.add(item.totalPrice),
      Money.zero(currency),
    );

    const order = new Order(id, {
      customerId,
      items,
      status: OrderStatus.pending(),
      shippingAddress,
      totalAmount,
    });

    order.addDomainEvent(
      new OrderCreatedEvent(id, customerId, totalAmount.amount, currency),
    );

    return order;
  }

  static reconstitute(
    id: string,
    props: OrderProps,
    createdAt: Date,
    updatedAt: Date,
  ): Order {
    const order = new Order(id, props);
    (order as any)._createdAt = createdAt;
    (order as any)._updatedAt = updatedAt;
    return order;
  }

  get customerId(): string {
    return this._customerId;
  }

  get items(): ReadonlyArray<OrderItem> {
    return [...this._items];
  }

  get status(): OrderStatus {
    return this._status;
  }

  get shippingAddress(): ShippingAddress {
    return this._shippingAddress;
  }

  get totalAmount(): Money {
    return this._totalAmount;
  }

  reserveInventory(): void {
    const targetStatus = OrderStatus.inventoryReserved();
    this.assertTransition(targetStatus);
    this._status = targetStatus;
    this._updatedAt = new Date();
    this.addDomainEvent(new OrderInventoryReservedEvent(this.id));
  }

  processPayment(): void {
    const targetStatus = OrderStatus.paymentProcessed();
    this.assertTransition(targetStatus);
    this._status = targetStatus;
    this._updatedAt = new Date();
    this.addDomainEvent(
      new OrderPaymentProcessedEvent(
        this.id,
        this._totalAmount.amount,
        this._totalAmount.currency,
      ),
    );
  }

  confirm(): void {
    const targetStatus = OrderStatus.confirmed();
    this.assertTransition(targetStatus);
    this._status = targetStatus;
    this._updatedAt = new Date();
    this.addDomainEvent(new OrderConfirmedEvent(this.id));
  }

  ship(): void {
    const targetStatus = OrderStatus.shipped();
    this.assertTransition(targetStatus);
    this._status = targetStatus;
    this._updatedAt = new Date();
    this.addDomainEvent(new OrderShippedEvent(this.id));
  }

  deliver(): void {
    const targetStatus = OrderStatus.delivered();
    this.assertTransition(targetStatus);
    this._status = targetStatus;
    this._updatedAt = new Date();
  }

  cancel(): void {
    const targetStatus = OrderStatus.cancelled();
    this.assertTransition(targetStatus);
    this._status = targetStatus;
    this._updatedAt = new Date();
    this.addDomainEvent(new OrderCancelledEvent(this.id, this._customerId));
  }

  private assertTransition(target: OrderStatus): void {
    if (!this._status.canTransitionTo(target)) {
      throw new InvalidOrderTransitionError(
        this._status.toString(),
        target.toString(),
      );
    }
  }
}
