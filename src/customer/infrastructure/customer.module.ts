import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KyselyModule } from '../../shared/infrastructure/database/kysely.module';
import { DbConfig } from '../../shared/config';
import { CustomerDatabase, KYSELY_CUSTOMER_DB } from './database/tables/customer.table';
import { KyselyCustomerRepository } from './database/repositories/customer.repository';
import { CUSTOMER_REPOSITORY, ICustomerRepository } from '../domain/repositories/customer.repository.interface';
import { RegisterCustomerUseCase } from '../application/use-cases/register-customer/register-customer.use-case';
import { FindCustomerByUserIdUseCase } from '../application/use-cases/find-customer-by-user-id/find-customer-by-user-id.use-case';
import { CUSTOMER_USE_CASE_TOKENS } from '../application/injection-tokens';

@Module({
  imports: [
    KyselyModule.forFeatureAsync<CustomerDatabase>({
      token: KYSELY_CUSTOMER_DB,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get<DbConfig>('customerDb')!,
    }),
  ],
  providers: [
    { provide: CUSTOMER_REPOSITORY, useClass: KyselyCustomerRepository },
    {
      provide: CUSTOMER_USE_CASE_TOKENS.REGISTER,
      useFactory: (customerRepository: ICustomerRepository) =>
        new RegisterCustomerUseCase(customerRepository),
      inject: [CUSTOMER_REPOSITORY],
    },
    {
      provide: CUSTOMER_USE_CASE_TOKENS.FIND_BY_USER_ID,
      useFactory: (customerRepository: ICustomerRepository) =>
        new FindCustomerByUserIdUseCase(customerRepository),
      inject: [CUSTOMER_REPOSITORY],
    },
  ],
  exports: [
    CUSTOMER_REPOSITORY,
    CUSTOMER_USE_CASE_TOKENS.REGISTER,
    CUSTOMER_USE_CASE_TOKENS.FIND_BY_USER_ID,
  ],
})
export class CustomerModule {}
