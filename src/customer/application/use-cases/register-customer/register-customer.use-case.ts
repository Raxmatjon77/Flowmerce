import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { IUseCase } from '../../../../shared/application/use-case.interface';
import { ICustomerRepository } from '../../../domain/repositories/customer.repository.interface';
import { Customer } from '../../../domain/entities/customer.entity';
import { CustomerResponseDto } from '../../dtos/customer-response.dto';

export interface RegisterCustomerInput {
  userId: string;
  email: string;
  name: string;
  password: string;
}

export class RegisterCustomerUseCase
  implements IUseCase<RegisterCustomerInput, CustomerResponseDto>
{
  constructor(private readonly customerRepository: ICustomerRepository) {}

  async execute(input: RegisterCustomerInput): Promise<CustomerResponseDto> {
    const exists = await this.customerRepository.existsByUserId(input.userId);
    if (exists) {
      throw new ConflictException(
        `Customer with userId '${input.userId}' already exists`,
      );
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const customer = Customer.create(
      uuidv4(),
      input.userId,
      input.email,
      input.name,
      passwordHash,
    );

    await this.customerRepository.save(customer);

    const dto = new CustomerResponseDto();
    dto.id = customer.id;
    dto.userId = customer.userId;
    dto.email = customer.email;
    dto.name = customer.name;
    dto.createdAt = customer.createdAt;
    return dto;
  }
}
