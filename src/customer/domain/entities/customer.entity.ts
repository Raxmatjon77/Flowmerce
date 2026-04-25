import { Entity } from '../../../shared/domain/entity.base';

export interface CustomerProps {
  userId: string;
  email: string;
  name: string;
  passwordHash: string;
}

export class Customer extends Entity<string> {
  private readonly _userId: string;
  private readonly _email: string;
  private readonly _name: string;
  private readonly _passwordHash: string;

  private constructor(id: string, props: CustomerProps) {
    super(id);
    this._userId = props.userId;
    this._email = props.email;
    this._name = props.name;
    this._passwordHash = props.passwordHash;
  }

  static create(
    id: string,
    userId: string,
    email: string,
    name: string,
    passwordHash: string,
  ): Customer {
    return new Customer(id, { userId, email, name, passwordHash });
  }

  static reconstitute(
    id: string,
    props: CustomerProps,
    createdAt?: Date,
    updatedAt?: Date,
  ): Customer {
    const customer = new Customer(id, props);
    if (createdAt) (customer as any)._createdAt = createdAt;
    if (updatedAt) (customer as any)._updatedAt = updatedAt;
    return customer;
  }

  get userId(): string {
    return this._userId;
  }

  get email(): string {
    return this._email;
  }

  get name(): string {
    return this._name;
  }

  get passwordHash(): string {
    return this._passwordHash;
  }
}
