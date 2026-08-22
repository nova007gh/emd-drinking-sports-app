import { describe, it, expect, beforeEach, vi } from "vitest";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

vi.stubGlobal("localStorage", localStorageMock);
vi.stubGlobal("window", { localStorage: localStorageMock });
vi.stubGlobal("indexedDB", undefined);

import {
  readOfflineQueue,
  enqueueOfflineOperation,
  markOfflineOperationDone,
  incrementOfflineAttempt
} from "@/lib/offline/queue";

beforeEach(() => {
  localStorageMock.clear();
});

describe("offline operation replay idempotency", () => {
  it("enqueues a new operation", async () => {
    const op = await enqueueOfflineOperation("cash_sale", { total: 100 }, "op-001");
    expect(op.id).toBe("op-001");
    expect(op.kind).toBe("cash_sale");
    expect(op.attempts).toBe(0);
    const queue = await readOfflineQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].id).toBe("op-001");
  });

  it("does not duplicate an operation with the same id", async () => {
    await enqueueOfflineOperation("cash_sale", { total: 100 }, "op-002");
    await enqueueOfflineOperation("cash_sale", { total: 100 }, "op-002");
    await enqueueOfflineOperation("cash_sale", { total: 100 }, "op-002");
    const queue = await readOfflineQueue();
    expect(queue.length).toBe(1);
  });

  it("allows different operations with different ids", async () => {
    await enqueueOfflineOperation("cash_sale", { total: 100 }, "op-003");
    await enqueueOfflineOperation("cash_sale", { total: 200 }, "op-004");
    const queue = await readOfflineQueue();
    expect(queue.length).toBe(2);
  });

  it("marks an operation as done by removing it", async () => {
    await enqueueOfflineOperation("cash_sale", { total: 50 }, "op-005");
    expect((await readOfflineQueue()).length).toBe(1);
    await markOfflineOperationDone("op-005");
    expect((await readOfflineQueue()).length).toBe(0);
  });

  it("increments attempt count on retry", async () => {
    await enqueueOfflineOperation("cash_sale", { total: 75 }, "op-006");
    await incrementOfflineAttempt("op-006");
    await incrementOfflineAttempt("op-006");
    const queue = await readOfflineQueue();
    expect(queue[0].attempts).toBe(2);
  });

  it("preserves operation payload through enqueue/read cycle", async () => {
    const payload = { orderId: "order-123", total: 250, method: "cash" };
    await enqueueOfflineOperation("cash_sale", payload, "op-007");
    const queue = await readOfflineQueue();
    expect(queue[0].payload).toEqual(payload);
  });

  it("generates a unique id when none is provided", async () => {
    const op1 = await enqueueOfflineOperation("cash_sale", { total: 10 });
    const op2 = await enqueueOfflineOperation("cash_sale", { total: 20 });
    expect(op1.id).not.toBe(op2.id);
    expect((await readOfflineQueue()).length).toBe(2);
  });
});
