import { describe, it, expect, beforeEach } from "vitest";
import {
  processPaymentInitiation,
  processCallback,
  getPaymentRecord,
  updatePaymentStatus,
  resetIdempotencyStores
} from "@/lib/payments/idempotency";
import { sandboxInitiatePayment, sandboxVerifyPayment } from "@/lib/payments/sandbox";

beforeEach(() => {
  resetIdempotencyStores();
});

describe("payment idempotency", () => {
  it("processes the first initiation with a given key", () => {
    const request = { amount: 100, currency: "GHS", method: "momo" as const, idempotencyKey: "key-001" };
    const record = processPaymentInitiation("key-001", request, (req) =>
      sandboxInitiatePayment({ ...req, idempotencyKey: "key-001" })
    );
    expect(record.status).toBe("pending");
    expect(record.idempotencyKey).toBe("key-001");
    expect(record.providerReference).toContain("SANDBOX-");
  });

  it("returns cached result for duplicate idempotency key", () => {
    const request = { amount: 100, currency: "GHS", method: "momo" as const, idempotencyKey: "key-002" };
    const first = processPaymentInitiation("key-002", request, (req) =>
      sandboxInitiatePayment({ ...req, idempotencyKey: "key-002" })
    );
    const second = processPaymentInitiation("key-002", request, (req) =>
      sandboxInitiatePayment({ ...req, idempotencyKey: "key-002" })
    );
    expect(second.providerReference).toBe(first.providerReference);
    expect(second.createdAt).toBe(first.createdAt);
  });

  it("does not call initiate function on duplicate key", () => {
    let callCount = 0;
    const request = { amount: 50, currency: "GHS", method: "cash" as const, idempotencyKey: "key-003" };
    const initiateFn = (req: typeof request) => {
      callCount++;
      return sandboxInitiatePayment({ ...req, idempotencyKey: "key-003" });
    };
    processPaymentInitiation("key-003", request, initiateFn);
    processPaymentInitiation("key-003", request, initiateFn);
    processPaymentInitiation("key-003", request, initiateFn);
    expect(callCount).toBe(1);
  });

  it("allows different idempotency keys to create separate records", () => {
    const req1 = { amount: 100, currency: "GHS", method: "momo" as const, idempotencyKey: "key-a" };
    const req2 = { amount: 200, currency: "GHS", method: "card" as const, idempotencyKey: "key-b" };
    const r1 = processPaymentInitiation("key-a", req1, (r) => sandboxInitiatePayment({ ...r, idempotencyKey: "key-a" }));
    const r2 = processPaymentInitiation("key-b", req2, (r) => sandboxInitiatePayment({ ...r, idempotencyKey: "key-b" }));
    expect(r1.amount).toBe(100);
    expect(r2.amount).toBe(200);
    expect(r1.providerReference).not.toBe(r2.providerReference);
  });
});

describe("callback replay idempotency", () => {
  it("processes the first callback for a provider reference", () => {
    const record = processCallback("SANDBOX-ABC12345", (ref) => sandboxVerifyPayment(ref));
    expect(record.status).toBe("successful");
    expect(record.providerReference).toBe("SANDBOX-ABC12345");
  });

  it("does not duplicate processing on callback replay", () => {
    let callCount = 0;
    const callbackFn = (ref: string) => {
      callCount++;
      return sandboxVerifyPayment(ref);
    };
    processCallback("SANDBOX-DEF67890", callbackFn);
    processCallback("SANDBOX-DEF67890", callbackFn);
    processCallback("SANDBOX-DEF67890", callbackFn);
    expect(callCount).toBe(1);
  });

  it("returns the same record on replay", () => {
    const first = processCallback("SANDBOX-GHI11111", (ref) => sandboxVerifyPayment(ref));
    const second = processCallback("SANDBOX-GHI11111", (ref) => sandboxVerifyPayment(ref));
    expect(second.processedAt).toBe(first.processedAt);
    expect(second.status).toBe(first.status);
  });

  it("allows different provider references to be processed independently", () => {
    const r1 = processCallback("SANDBOX-REF001", (ref) => sandboxVerifyPayment(ref));
    const r2 = processCallback("SANDBOX-REF002", (ref) => sandboxVerifyPayment(ref));
    expect(r1.providerReference).toBe("SANDBOX-REF001");
    expect(r2.providerReference).toBe("SANDBOX-REF002");
  });
});

describe("payment status updates", () => {
  it("updates payment status from pending to successful", () => {
    const request = { amount: 100, currency: "GHS", method: "momo" as const, idempotencyKey: "key-update" };
    processPaymentInitiation("key-update", request, (req) =>
      sandboxInitiatePayment({ ...req, idempotencyKey: "key-update" })
    );
    const updated = updatePaymentStatus("key-update", "successful");
    expect(updated?.status).toBe("successful");
    expect(getPaymentRecord("key-update")?.status).toBe("successful");
  });

  it("returns undefined for unknown idempotency key", () => {
    const result = updatePaymentStatus("nonexistent-key", "successful");
    expect(result).toBeUndefined();
  });
});
