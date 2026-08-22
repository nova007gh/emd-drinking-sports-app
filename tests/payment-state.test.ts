import { describe, expect, it } from "vitest";
import { assertPaymentTransition, canTransitionPayment } from "@/lib/payments/state-machine";

describe("payment state machine", () => {
  it("allows pending to successful", () => {
    expect(canTransitionPayment("pending", "successful")).toBe(true);
  });

  it("allows pending to failed", () => {
    expect(canTransitionPayment("pending", "failed")).toBe(true);
  });

  it("allows successful to reversed", () => {
    expect(canTransitionPayment("successful", "reversed")).toBe(true);
  });

  it("blocks failed to successful replay", () => {
    expect(() => assertPaymentTransition("failed", "successful")).toThrow();
  });

  it("blocks reversed to successful", () => {
    expect(canTransitionPayment("reversed", "successful")).toBe(false);
  });
});
