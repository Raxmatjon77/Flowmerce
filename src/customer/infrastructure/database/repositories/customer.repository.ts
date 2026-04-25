import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { ICustomerRepository } from '../../../domain/repositories/customer.repository.interface';
import { Customer } from '../../../domain/entities/customer.entity';
import { CustomerDatabase, KYSELY_CUSTOMER_DB } from '../tables/customer.table';
import { CustomerMapper } from '../mappers/customer.mapper';

@Injectable()
export class KyselyCustomerRepository implements ICustomerRepository {
  constructor(
    @Inject(KYSELY_CUSTOMER_DB)
    private readonly db: Kysely<CustomerDatabase>,
  ) {}

  async findByUserId(userId: string): Promise<Customer | null> {
    const row = await this.db
      .selectFrom('customers')
      .selectAll()
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!row) return null;

    return CustomerMapper.toDomain(row);
  }

  async save(customer: Customer): Promise<void> {
    const record = CustomerMapper.toPersistence(customer);

    await this.db
      .insertInto('customers')
      .values({
        ...record,
        created_at: customer.createdAt,
        updated_at: customer.updatedAt,
      } as any)
      .onConflict((oc) =>
        oc.column('id').doUpdateSet({
          email: record.email,
          name: record.name,
          password_hash: record.password_hash,
          updated_at: new Date(),
        }),
      )
      .execute();
  }

  async existsByUserId(userId: string): Promise<boolean> {
    const row = await this.db
      .selectFrom('customers')
      .select('id')
      .where('user_id', '=', userId)
      .executeTakeFirst();

    return row !== undefined;
  }
}
