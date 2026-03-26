import { ValueObject } from '@shared/domain';

interface TrackingNumberProps {
  value: string;
}

export class TrackingNumber extends ValueObject<TrackingNumberProps> {
  private static readonly TRACKING_PATTERN = /^[A-Za-z0-9-]{6,40}$/;

  private constructor(props: TrackingNumberProps) {
    super(props);
  }

  static create(value: string): TrackingNumber {
    const trimmed = value.trim();

    if (!trimmed) {
      throw new Error('Tracking number cannot be empty');
    }

    if (!TrackingNumber.TRACKING_PATTERN.test(trimmed)) {
      throw new Error(
        `Invalid tracking number format: "${trimmed}". Must be 6-40 alphanumeric characters or dashes.`,
      );
    }

    return new TrackingNumber({ value: trimmed });
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
