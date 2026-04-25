import { Customer } from '../entities/customer.entity';

export const CUSTOMER_REPOSITORY = Symbol('CUSTOMER_REPOSITORY');

export interface ICustomerRepository {
  findByUserId(userId: string): Promise<Customer | null>;
  save(customer: Customer): Promise<void>;
  existsByUserId(userId: string): Promise<boolean>;
}
