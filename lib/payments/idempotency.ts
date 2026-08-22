import type { PaymentStatus } from "@/lib/types";

export interface PaymentRecord {
  idempotencyKey: string;
  providerReference?: string;
  status: PaymentStatus;
  amount: number;
  orderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CallbackRecord {
  providerReference: string;
  status: PaymentStatus;
  processedAt: string;
}

type PaymentStore = Map<string, PaymentRecord>;
type CallbackStore = Map<string, CallbackRecord>;

const paymentStore: PaymentStore = new Map();
const callbackStore: CallbackStore = new Map();

export function resetIdempotencyStores(): void {
  paymentStore.clear();
  callbackStore.clear();
}

export function getPaymentRecord(idempotencyKey: string): PaymentRecord | undefined {
  return paymentStore.get(idempotencyKey);
}

export function processPaymentInitiation<T extends { amount: number }>(
  idempotencyKey: string,
  request: T,
  initiateFn: (req: T) => { status: PaymentStatus; providerReference: string; message: string }
): PaymentRecord {
  const existing = paymentStore.get(idempotencyKey);
  if (existing) return existing;

  const result = initiateFn(request);
  const now = new Date().toISOString();
  const record: PaymentRecord = {
    idempotencyKey,
    providerReference: result.providerReference,
    status: result.status,
    amount: request.amount,
    createdAt: now,
    updatedAt: now
  };
  paymentStore.set(idempotencyKey, record);
  return record;
}

export function processCallback(
  providerReference: string,
  callbackFn: (ref: string) => { status: PaymentStatus }
): CallbackRecord {
  const existing = callbackStore.get(providerReference);
  if (existing) return existing;

  const result = callbackFn(providerReference);
  const record: CallbackRecord = {
    providerReference,
    status: result.status,
    processedAt: new Date().toISOString()
  };
  callbackStore.set(providerReference, record);
  return record;
}

export function getCallbackRecord(providerReference: string): CallbackRecord | undefined {
  return callbackStore.get(providerReference);
}

export function updatePaymentStatus(idempotencyKey: string, status: PaymentStatus): PaymentRecord | undefined {
  const record = paymentStore.get(idempotencyKey);
  if (!record) return undefined;
  const updated = { ...record, status, updatedAt: new Date().toISOString() };
  paymentStore.set(idempotencyKey, updated);
  return updated;
}
