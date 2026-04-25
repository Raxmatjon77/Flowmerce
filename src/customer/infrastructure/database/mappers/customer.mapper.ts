import { Selectable } from 'kysely';
import { Customer } from '../../../domain/entities/customer.entity';
import { CustomerTable } from '../tables/customer.table';

export class CustomerMapper {
  static toDomain(row: Selectable<CustomerTable>): Customer {
    return Customer.reconstitute(
      row.id,
      {
        userId: row.user_id,
        email: row.email,
        name: row.name,
        passwordHash: row.password_hash,
      },
      new Date(row.created_at),
      new Date(row.updated_at),
    );
  }

  static toPersistence(
    customer: Customer,
  ): Omit<CustomerTable, 'created_at' | 'updated_at'> {
    return {
      id: customer.id,
      user_id: customer.userId,
      email: customer.email,
      name: customer.name,
      password_hash: customer.passwordHash,
    };
  }
}
