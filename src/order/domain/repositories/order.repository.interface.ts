import { Order } from '../entities/order.entity';
import { OrderStatus } from '../value-objects/order-status.value-object';

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');

export interface IOrderRepository {
  save(order: Order): Promise<void>;
  findAll(): Promise<Order[]>;
  findById(id: string): Promise<Order | null>;
  findByCustomerId(customerId: string): Promise<Order[]>;
  updateStatus(id: string, status: OrderStatus): Promise<void>;
}
