export interface StartOrderWorkflowInput {
  orderId: string;
  customerId: string;
  items: Array<{ sku: string; quantity: number }>;
  paymentDetails: {
    amount: number;
    currency: string;
    method: {
      type: string;
      last4Digits: string;
      expiryMonth: number;
      expiryYear: number;
    };
  };
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export interface IOrderWorkflowOrchestrator {
  /**
   * Start the order processing workflow
   */
  startOrderProcessing(input: StartOrderWorkflowInput): Promise<void>;

  /**
   * Send confirmation signal to an existing workflow
   */
  confirmOrder(orderId: string): Promise<void>;

  /**
   * Cancel/terminate an order workflow
   */
  cancelOrderWorkflow(orderId: string): Promise<void>;

  /**
   * Get workflow status
   */
  getWorkflowStatus(orderId: string): Promise<string | null>;
}

export const ORDER_WORKFLOW_ORCHESTRATOR = Symbol('ORDER_WORKFLOW_ORCHESTRATOR');
