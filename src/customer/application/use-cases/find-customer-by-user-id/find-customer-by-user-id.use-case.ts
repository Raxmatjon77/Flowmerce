import { IUseCase } from '../../../../shared/application/use-case.interface';
import { ICustomerRepository } from '../../../domain/repositories/customer.repository.interface';
import { Customer } from '../../../domain/entities/customer.entity';

export interface FindCustomerByUserIdInput {
  userId: string;
}

export class FindCustomerByUserIdUseCase
  implements IUseCase<FindCustomerByUserIdInput, Customer | null>
{
  constructor(private readonly customerRepository: ICustomerRepository) {}

  async execute(input: FindCustomerByUserIdInput): Promise<Customer | null> {
    return this.customerRepository.findByUserId(input.userId);
  }
}
