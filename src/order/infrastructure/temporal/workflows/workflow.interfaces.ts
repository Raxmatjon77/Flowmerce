/**
 * Input/output types for the order processing workflow.
 */

export interface OrderProcessingInput {
  orderId: string;
  customerId: string;
  items: Array<{ sku: string; quantity: number }>;
  paymentDetails: PaymentDetailsInput;
  shippingAddress: WorkflowShippingAddress;
}

export interface PaymentDetailsInput {
  amount: number;
  currency: string;
  method: {
    type: string;
    last4Digits: string;
    expiryMonth: number;
    expiryYear: number;
  };
}

export interface WorkflowShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}
