import { AggregateRoot } from '../../../shared/domain/aggregate-root.base';
import { Money } from '../value-objects/money.value-object';
import { PaymentStatus } from '../value-objects/payment-status.value-object';
import { PaymentMethod } from '../value-objects/payment-method.value-object';
import { PaymentCreatedEvent } from '../events/payment-created.event';
import { PaymentProcessedEvent } from '../events/payment-processed.event';
import { PaymentFailedEvent } from '../events/payment-failed.event';
import { PaymentRefundedEvent } from '../events/payment-refunded.event';
import { InvalidPaymentTransitionError } from '../errors/payment-domain.errors';

export interface PaymentProps {
  orderId: string;
  amount: Money;
  status: PaymentStatus;
  method: PaymentMethod;
  transactionId: string | null;
  failureReason: string | null;
}

export class Payment extends AggregateRoot<string> {
  private readonly _orderId: string;
  private readonly _amount: Money;
  private _status: PaymentStatus;
  private readonly _method: PaymentMethod;
  private _transactionId: string | null;
  private _failureReason: string | null;

  private constructor(id: string, props: PaymentProps) {
    super(id);
    this._orderId = props.orderId;
    this._amount = props.amount;
    this._status = props.status;
    this._method = props.method;
    this._transactionId = props.transactionId;
    this._failureReason = props.failureReason;
  }

  static create(
    id: string,
    orderId: string,
    amount: Money,
    method: PaymentMethod,
  ): Payment {
    if (!orderId || orderId.trim().length === 0) {
      throw new Error('Order ID must not be empty');
    }
    if (amount.isZero()) {
      throw new Error('Payment amount must be greater than zero');
    }

    const payment = new Payment(id, {
      orderId,
      amount,
      status: PaymentStatus.pending(),
      method,
      transactionId: null,
      failureReason: null,
    });

    payment.addDomainEvent(
      new PaymentCreatedEvent(id, orderId, amount.amount, amount.currency),
    );

    return payment;
  }

  static reconstitute(
    id: string,
    props: PaymentProps,
    createdAt: Date,
    updatedAt: Date,
  ): Payment {
    const payment = new Payment(id, props);
    (payment as any)._createdAt = createdAt;
    (payment as any)._updatedAt = updatedAt;
    return payment;
  }

  get orderId(): string {
    return this._orderId;
  }

  get amount(): Money {
    return this._amount;
  }

  get status(): PaymentStatus {
    return this._status;
  }

  get method(): PaymentMethod {
    return this._method;
  }

  get transactionId(): string | null {
    return this._transactionId;
  }

  get failureReason(): string | null {
    return this._failureReason;
  }

  process(): void {
    const targetStatus = PaymentStatus.processing();
    this.assertTransition(targetStatus);
    this._status = targetStatus;
    this._updatedAt = new Date();
  }

  complete(transactionId: string): void {
    if (!transactionId || transactionId.trim().length === 0) {
      throw new Error('Transaction ID must not be empty');
    }

    const targetStatus = PaymentStatus.completed();
    this.assertTransition(targetStatus);
    this._status = targetStatus;
    this._transactionId = transactionId;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new PaymentProcessedEvent(
        this.id,
        this._orderId,
        transactionId,
        this._amount.amount,
        this._amount.currency,
      ),
    );
  }

  fail(reason: string): void {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Failure reason must not be empty');
    }

    const targetStatus = PaymentStatus.failed();
    this.assertTransition(targetStatus);
    this._status = targetStatus;
    this._failureReason = reason;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new PaymentFailedEvent(this.id, this._orderId, reason),
    );
  }

  refund(): void {
    const targetStatus = PaymentStatus.refunded();
    this.assertTransition(targetStatus);
    this._status = targetStatus;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new PaymentRefundedEvent(
        this.id,
        this._orderId,
        this._amount.amount,
        this._amount.currency,
      ),
    );
  }

  private assertTransition(target: PaymentStatus): void {
    if (!this._status.canTransitionTo(target)) {
      throw new InvalidPaymentTransitionError(
        this._status.toString(),
        target.toString(),
      );
    }
  }
}
