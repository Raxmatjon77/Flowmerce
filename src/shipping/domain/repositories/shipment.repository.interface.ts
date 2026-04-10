import { Shipment } from '../entities/shipment.entity';
import { ShipmentStatus } from '../value-objects/shipment-status.value-object';

export const SHIPMENT_REPOSITORY = Symbol('SHIPMENT_REPOSITORY');

export interface IShipmentRepository {
  save(shipment: Shipment): Promise<void>;
  findAll(): Promise<Shipment[]>;
  findById(id: string): Promise<Shipment | null>;
  findByOrderId(orderId: string): Promise<Shipment | null>;
  updateStatus(id: string, status: ShipmentStatus): Promise<void>;
}
