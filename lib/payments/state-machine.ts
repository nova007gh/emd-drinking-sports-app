export type PaymentStatus = "pending" | "successful" | "failed" | "reversed";

const transitions: Record<PaymentStatus, ReadonlySet<PaymentStatus>> = {
  pending: new Set(["successful", "failed"]),
  successful: new Set(["reversed"]),
  failed: new Set(),
  reversed: new Set()
};

export function canTransitionPayment(from: PaymentStatus, to: PaymentStatus): boolean {
  if (from === to) return true;
  return transitions[from].has(to);
}

export function assertPaymentTransition(from: PaymentStatus, to: PaymentStatus): void {
  if (!canTransitionPayment(from, to)) {
    throw new Error(`Invalid payment transition: ${from} -> ${to}`);
  }
}
