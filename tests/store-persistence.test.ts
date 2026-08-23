import { describe, it, expect, vi } from "vitest";

/**
 * Guards the demo-mode persistence contract:
 *  - work an operator does (sales, stock, tables, customers) survives a reload
 *  - a new seed catalogue still reaches browsers that cached an older one
 * Regression cover for the bug where merge unconditionally re-applied the seed
 * and silently discarded every sale and stock movement on refresh.
 */

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

import { useAppStore, mergePersistedState } from "@/lib/store";
import { productsSeed } from "@/lib/seed";

const base = () => useAppStore.getState();
const seedVersion = () => base().seedVersion;

describe("demo-mode persistence", () => {
  it("exposes a numeric seedVersion so stale caches can be detected", () => {
    expect(typeof seedVersion()).toBe("number");
    expect(seedVersion()).toBeGreaterThan(0);
  });

  it("keeps stock levels an operator sold down when the seed version matches", () => {
    const soldDown = productsSeed.map((p, i) => (i === 0 ? { ...p, stock: 0 } : p));

    const merged = mergePersistedState(
      { seedVersion: seedVersion(), products: soldDown },
      base()
    );

    // The whole point: a sale's stock decrement must not be reset to the seed.
    expect(merged.products[0].stock).toBe(0);
    expect(productsSeed[0].stock).toBeGreaterThan(0); // seed really did differ
  });

  it("keeps customers, sales and table state across a reload", () => {
    const merged = mergePersistedState(
      {
        seedVersion: seedVersion(),
        customers: [{
          id: "c-persisted", name: "Persisted Customer", phone: "0200000000",
          debt: 250, loyaltyPoints: 10, walletBalance: 40, totalSpent: 900, visitCount: 3
        }],
        tables: [{ id: "t1", name: "Table 1", occupied: true, bill: 120 }],
        barOpen: false
      },
      base()
    );

    expect(merged.customers).toHaveLength(1);
    expect(merged.customers[0].debt).toBe(250);
    expect(merged.tables[0].occupied).toBe(true);
    expect(merged.tables[0].bill).toBe(120);
    expect(merged.barOpen).toBe(false);
  });

  it("rolls out a new catalogue when the cached seed version is stale", () => {
    const merged = mergePersistedState(
      {
        seedVersion: -1,
        // An old cache that only knew about a handful of products.
        products: productsSeed.slice(0, 3),
        customerOrders: [{
          id: "co-1", customerId: "c1", tableId: "t1",
          lines: [], status: "pending" as const, createdAt: new Date().toISOString()
        }]
      },
      base()
    );

    // Fresh catalogue rolled out...
    expect(merged.products).toHaveLength(productsSeed.length);
    expect(merged.seedVersion).toBe(seedVersion());
    // ...but the operator's own portal activity is preserved.
    expect(merged.customerOrders).toHaveLength(1);
  });

  it("treats a first run with no cache as a fresh seed", () => {
    const merged = mergePersistedState(undefined, base());
    expect(merged.products).toHaveLength(productsSeed.length);
    expect(merged.seedVersion).toBe(seedVersion());
    expect(merged.customerOrders).toEqual([]);
    expect(merged.barOpen).toBe(true);
  });
});
