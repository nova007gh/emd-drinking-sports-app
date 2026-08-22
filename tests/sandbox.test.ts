import { describe, it, expect } from "vitest";
import { sandboxInitiatePayment, sandboxVerifyPayment, sandboxFailPayment, sandboxReversePayment } from "@/lib/payments/sandbox";

describe("sandboxInitiatePayment", () => {
  it("returns pending status for valid amount", () => {
    const result = sandboxInitiatePayment({ amount: 100, currency: "GHS", method: "momo", idempotencyKey: "test-key-123" });
    expect(result.status).toBe("pending");
    expect(result.providerReference).toContain("SANDBOX-");
  });

  it("fails for zero or negative amounts", () => {
    const result = sandboxInitiatePayment({ amount: 0, currency: "GHS", method: "cash", idempotencyKey: "test-key-456" });
    expect(result.status).toBe("failed");
  });
});

describe("sandboxVerifyPayment", () => {
  it("returns successful for valid sandbox reference", () => {
    const result = sandboxVerifyPayment("SANDBOX-ABC12345");
    expect(result.status).toBe("successful");
  });

  it("fails for invalid reference", () => {
    const result = sandboxVerifyPayment("INVALID-REF");
    expect(result.status).toBe("failed");
  });
});

describe("sandboxFailPayment", () => {
  it("returns failed status", () => {
    const result = sandboxFailPayment("SANDBOX-XYZ");
    expect(result.status).toBe("failed");
  });
});

describe("sandboxReversePayment", () => {
  it("returns reversed status", () => {
    const result = sandboxReversePayment("SANDBOX-REV");
    expect(result.status).toBe("reversed");
  });
});
