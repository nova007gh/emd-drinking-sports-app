import type { PaymentMethod, PaymentStatus } from "@/lib/types";

export interface SandboxPaymentRequest {
  amount: number;
  currency: string;
  method: PaymentMethod;
  idempotencyKey: string;
  phoneMasked?: string;
  cardLast4?: string;
}

export interface SandboxPaymentResponse {
  status: PaymentStatus;
  providerReference: string;
  message: string;
}

export function sandboxInitiatePayment(req: SandboxPaymentRequest): SandboxPaymentResponse {
  const providerReference = `SANDBOX-${req.idempotencyKey.slice(0, 8).toUpperCase()}`;

  if (req.amount <= 0) {
    return { status: "failed", providerReference, message: "Amount must be greater than zero" };
  }

  return {
    status: "pending",
    providerReference,
    message: `Sandbox ${req.method} payment initiated for ${req.currency} ${req.amount.toFixed(2)}`
  };
}

export function sandboxVerifyPayment(providerReference: string): SandboxPaymentResponse {
  if (!providerReference.startsWith("SANDBOX-")) {
    return { status: "failed", providerReference, message: "Invalid sandbox reference" };
  }

  return {
    status: "successful",
    providerReference,
    message: "Sandbox payment verified successfully"
  };
}

export function sandboxFailPayment(providerReference: string): SandboxPaymentResponse {
  return {
    status: "failed",
    providerReference,
    message: "Sandbox payment failed - insufficient funds"
  };
}

export function sandboxReversePayment(providerReference: string): SandboxPaymentResponse {
  return {
    status: "reversed",
    providerReference,
    message: "Sandbox payment reversed"
  };
}
