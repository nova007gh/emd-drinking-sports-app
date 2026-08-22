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

describe("offline queue with localStorage fallback (no IndexedDB)", () => {
  it("falls back to localStorage when IndexedDB is unavailable", async () => {
    await enqueueOfflineOperation("cash_sale", { total: 100 }, "test-001");
    const queue = await readOfflineQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].id).toBe("test-001");
    expect(queue[0].payload).toEqual({ total: 100 });
  });

  it("persists across reads", async () => {
    await enqueueOfflineOperation("cash_sale", { total: 200 }, "test-002");
    await enqueueOfflineOperation("table_update", { tableId: "t1" }, "test-003");
    const queue = await readOfflineQueue();
    expect(queue.length).toBe(2);
  });

  it("removes completed operations", async () => {
    await enqueueOfflineOperation("cash_sale", { total: 50 }, "test-004");
    await markOfflineOperationDone("test-004");
    const queue = await readOfflineQueue();
    expect(queue.length).toBe(0);
  });

  it("tracks retry attempts", async () => {
    await enqueueOfflineOperation("cash_sale", { total: 75 }, "test-005");
    await incrementOfflineAttempt("test-005");
    await incrementOfflineAttempt("test-005");
    await incrementOfflineAttempt("test-005");
    const queue = await readOfflineQueue();
    expect(queue[0].attempts).toBe(3);
  });

  it("preserves operation kind and metadata", async () => {
    await enqueueOfflineOperation("inventory_note", { productId: "p1", note: "Damaged" }, "test-006");
    const queue = await readOfflineQueue();
    expect(queue[0].kind).toBe("inventory_note");
    expect(queue[0].createdAt).toBeDefined();
  });
});
