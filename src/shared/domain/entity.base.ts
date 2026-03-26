export abstract class Entity<T extends string = string> {
  constructor(
    protected readonly _id: T,
    protected _createdAt: Date = new Date(),
    protected _updatedAt: Date = new Date(),
  ) {}

  get id(): T {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  equals(other: Entity<T>): boolean {
    if (other === null || other === undefined) return false;
    if (this === other) return true;
    return this._id === other._id;
  }
}
