/**
 * Constants used inside the Temporal workflow sandbox.
 *
 * NOTE: Temporal workflows run in a deterministic sandbox that restricts
 * imports. Only pure-value modules (no I/O, no Node APIs) can be imported.
 * These constants are safe for workflow use.
 */

// --- Signals ---
export const CONFIRM_ORDER_SIGNAL = 'confirmOrder';

// --- Order Status (used by updateOrderStatus activity) ---
export const WORKFLOW_ORDER_STATUS = {
  INVENTORY_RESERVED: 'INVENTORY_RESERVED',
  PAYMENT_PROCESSED: 'PAYMENT_PROCESSED',
  SHIPPED: 'SHIPPED',
} as const;

// --- Notification Types ---
export const WORKFLOW_NOTIFICATION_TYPE = {
  ORDER_CONFIRMED: 'ORDER_CONFIRMED',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
} as const;

// --- Timeouts ---
export const WORKFLOW_TIMEOUTS = {
  CONFIRMATION_WAIT: '24h',
  ACTIVITY_START_TO_CLOSE: '30s',
} as const;

// --- Retry Policy ---
export const WORKFLOW_RETRY_POLICY = {
  MAXIMUM_ATTEMPTS: 3,
  INITIAL_INTERVAL: '1s',
  BACKOFF_COEFFICIENT: 2,
} as const;
