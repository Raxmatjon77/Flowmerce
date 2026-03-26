import { AggregateRoot } from '@shared/domain';
import { TrackingNumber } from '../value-objects/tracking-number.value-object';
import { Carrier } from '../value-objects/carrier.value-object';
import {
  ShipmentStatus,
  ShipmentStatusEnum,
} from '../value-objects/shipment-status.value-object';
import { InvalidShipmentTransitionError } from '../errors/shipping-domain.errors';
import { ShipmentCreatedEvent } from '../events/shipment-created.event';
import { ShipmentDeliveredEvent } from '../events/shipment-delivered.event';

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface ShipmentProps {
  orderId: string;
  trackingNumber: TrackingNumber | null;
  carrier: Carrier | null;
  status: ShipmentStatus;
  shippingAddress: ShippingAddress;
  estimatedDelivery: Date | null;
}

export class Shipment extends AggregateRoot {
  private _orderId: string;
  private _trackingNumber: TrackingNumber | null;
  private _carrier: Carrier | null;
  private _status: ShipmentStatus;
  private _shippingAddress: ShippingAddress;
  private _estimatedDelivery: Date | null;

  private constructor(id: string, props: ShipmentProps) {
    super(id);
    this._orderId = props.orderId;
    this._trackingNumber = props.trackingNumber;
    this._carrier = props.carrier;
    this._status = props.status;
    this._shippingAddress = props.shippingAddress;
    this._estimatedDelivery = props.estimatedDelivery;
  }

  static create(
    id: string,
    orderId: string,
    shippingAddress: ShippingAddress,
  ): Shipment {
    const shipment = new Shipment(id, {
      orderId,
      trackingNumber: null,
      carrier: null,
      status: ShipmentStatus.pending(),
      shippingAddress,
      estimatedDelivery: null,
    });

    shipment.addDomainEvent(new ShipmentCreatedEvent(id, orderId));

    return shipment;
  }

  static reconstitute(id: string, props: ShipmentProps): Shipment {
    return new Shipment(id, props);
  }

  get orderId(): string {
    return this._orderId;
  }

  get trackingNumber(): TrackingNumber | null {
    return this._trackingNumber;
  }

  get carrier(): Carrier | null {
    return this._carrier;
  }

  get status(): ShipmentStatus {
    return this._status;
  }

  get shippingAddress(): Readonly<ShippingAddress> {
    return this._shippingAddress;
  }

  get estimatedDelivery(): Date | null {
    return this._estimatedDelivery;
  }

  assignCarrier(
    carrier: Carrier,
    trackingNumber: TrackingNumber,
    estimatedDelivery?: Date,
  ): void {
    this._carrier = carrier;
    this._trackingNumber = trackingNumber;
    if (estimatedDelivery) {
      this._estimatedDelivery = estimatedDelivery;
    }
    this._updatedAt = new Date();
  }

  pickUp(): void {
    this.transitionStatus(ShipmentStatusEnum.PICKED_UP);
  }

  inTransit(): void {
    this.transitionStatus(ShipmentStatusEnum.IN_TRANSIT);
  }

  deliver(): void {
    this.transitionStatus(ShipmentStatusEnum.DELIVERED);

    this.addDomainEvent(
      new ShipmentDeliveredEvent(this.id, this._orderId, new Date()),
    );
  }

  returnShipment(): void {
    this.transitionStatus(ShipmentStatusEnum.RETURNED);
  }

  private transitionStatus(target: ShipmentStatusEnum): void {
    if (!this._status.canTransitionTo(target)) {
      throw new InvalidShipmentTransitionError(
        this.id,
        this._status.value,
        target,
      );
    }

    this._status = this._status.transitionTo(target);
    this._updatedAt = new Date();
  }
}
