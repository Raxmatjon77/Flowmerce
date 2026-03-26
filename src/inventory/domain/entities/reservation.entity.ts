import { Entity } from '@shared/domain';

export interface ReservationProps {
  inventoryItemId: string;
  orderId: string;
  quantity: number;
  expiresAt: Date;
  released: boolean;
}

export class Reservation extends Entity {
  private _inventoryItemId: string;
  private _orderId: string;
  private _quantity: number;
  private _expiresAt: Date;
  private _released: boolean;

  private constructor(id: string, props: ReservationProps) {
    super(id);
    this._inventoryItemId = props.inventoryItemId;
    this._orderId = props.orderId;
    this._quantity = props.quantity;
    this._expiresAt = props.expiresAt;
    this._released = props.released;
  }

  static create(
    id: string,
    props: Omit<ReservationProps, 'released'>,
  ): Reservation {
    return new Reservation(id, { ...props, released: false });
  }

  static reconstitute(id: string, props: ReservationProps): Reservation {
    return new Reservation(id, props);
  }

  get inventoryItemId(): string {
    return this._inventoryItemId;
  }

  get orderId(): string {
    return this._orderId;
  }

  get quantity(): number {
    return this._quantity;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }

  get released(): boolean {
    return this._released;
  }

  release(): void {
    if (this._released) {
      throw new Error(`Reservation ${this.id} is already released`);
    }
    this._released = true;
    this._updatedAt = new Date();
  }

  isExpired(now: Date = new Date()): boolean {
    return now >= this._expiresAt;
  }
}
