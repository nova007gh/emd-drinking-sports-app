import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * The customer portal must behave like a real sales channel, not a UI mock:
 * placing an order draws stock and opens a tab, and paying recognises revenue
 * into sales so it reaches Today's Sales, reports and reconciliation.
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

import { useAppStore } from "@/lib/store";
import { customersSeed, productsSeed, tablesSeed } from "@/lib/seed";
import { InventoryError } from "@/lib/domain/inventory";
import type { CartLine } from "@/lib/types";

const TABLE_ID = "t1";
const CUSTOMER_ID = customersSeed[0].id;

function reset() {
  useAppStore.setState({
    products: productsSeed.map(p => ({ ...p })),
    customers: customersSeed.map(c => ({ ...c })),
    tables: tablesSeed.map(t => ({ ...t, occupied: false, bill: 0 })),
    sales: [],
    stockMovements: [],
    customerOrders: [],
    cart: []
  });
}

/** A one-bottle order line for the given product. */
function bottleLine(productId: string, quantity = 1): CartLine {
  const p = productsSeed.find(x => x.id === productId)!;
  return { id: `${productId}-bottle`, productId, name: p.name, mode: "bottle", unitPrice: p.bottlePrice, quantity };
}

describe("customer portal orders", () => {
  beforeEach(reset);

  it("draws stock when an order is placed", () => {
    const product = productsSeed.find(p => p.stock > 2)!;
    const before = useAppStore.getState().products.find(p => p.id === product.id)!.stock;

    useAppStore.getState().placeCustomerOrder(CUSTOMER_ID, TABLE_ID, [bottleLine(product.id, 2)]);

    const after = useAppStore.getState().products.find(p => p.id === product.id)!.stock;
    expect(after).toBe(before - 2);
  });

  it("records a stock movement so inventory is auditable", () => {
    const product = productsSeed.find(p => p.stock > 0)!;
    useAppStore.getState().placeCustomerOrder(CUSTOMER_ID, TABLE_ID, [bottleLine(product.id)]);

    const movements = useAppStore.getState().stockMovements;
    expect(movements).toHaveLength(1);
    expect(movements[0].productId).toBe(product.id);
    expect(movements[0].bottleDelta).toBe(-1);
    expect(movements[0].reason).toMatch(/portal/i);
  });

  it("opens a tab on the table for the order value", () => {
    const product = productsSeed.find(p => p.stock > 0)!;
    useAppStore.getState().placeCustomerOrder(CUSTOMER_ID, TABLE_ID, [bottleLine(product.id, 3)]);

    const table = useAppStore.getState().tables.find(t => t.id === TABLE_ID)!;
    expect(table.occupied).toBe(true);
    expect(table.bill).toBe(product.bottlePrice * 3);
  });

  it("does not recognise revenue until the order is paid", () => {
    const product = productsSeed.find(p => p.stock > 0)!;
    const id = useAppStore.getState().placeCustomerOrder(CUSTOMER_ID, TABLE_ID, [bottleLine(product.id)]);

    expect(useAppStore.getState().sales).toHaveLength(0);

    useAppStore.getState().updateCustomerOrderStatus(id, "preparing");
    useAppStore.getState().updateCustomerOrderStatus(id, "served");
    expect(useAppStore.getState().sales).toHaveLength(0);
  });

  it("writes a real sale when the order is paid", () => {
    const product = productsSeed.find(p => p.stock > 0)!;
    const id = useAppStore.getState().placeCustomerOrder(CUSTOMER_ID, TABLE_ID, [bottleLine(product.id, 2)]);

    useAppStore.getState().updateCustomerOrderStatus(id, "paid", "momo");

    const sales = useAppStore.getState().sales;
    expect(sales).toHaveLength(1);
    expect(sales[0].total).toBe(product.bottlePrice * 2);
    expect(sales[0].paymentMethod).toBe("momo");
    expect(sales[0].customerId).toBe(CUSTOMER_ID);
    expect(sales[0].tableId).toBe(TABLE_ID);
    expect(sales[0].voided).toBe(false);
  });

  it("marks card and momo sales pending, cash and wallet successful", () => {
    const product = productsSeed.find(p => p.stock > 3)!;

    const momoId = useAppStore.getState().placeCustomerOrder(CUSTOMER_ID, TABLE_ID, [bottleLine(product.id)]);
    useAppStore.getState().updateCustomerOrderStatus(momoId, "paid", "momo");
    expect(useAppStore.getState().sales[0].paymentStatus).toBe("pending");

    const cashId = useAppStore.getState().placeCustomerOrder(CUSTOMER_ID, TABLE_ID, [bottleLine(product.id)]);
    useAppStore.getState().updateCustomerOrderStatus(cashId, "paid", "cash");
    expect(useAppStore.getState().sales[0].paymentStatus).toBe("successful");
  });

  it("credits loyalty points and spend to the customer on payment", () => {
    const product = productsSeed.find(p => p.stock > 0 && p.bottlePrice >= 20)!;
    const before = useAppStore.getState().customers.find(c => c.id === CUSTOMER_ID)!;

    const id = useAppStore.getState().placeCustomerOrder(CUSTOMER_ID, TABLE_ID, [bottleLine(product.id)]);
    useAppStore.getState().updateCustomerOrderStatus(id, "paid", "cash");

    const after = useAppStore.getState().customers.find(c => c.id === CUSTOMER_ID)!;
    expect(after.totalSpent).toBe(before.totalSpent + product.bottlePrice);
    expect(after.loyaltyPoints).toBe(before.loyaltyPoints + Math.floor(product.bottlePrice / 10));
    expect(after.visitCount).toBe(before.visitCount + 1);
  });

  it("clears the paid amount off the tab and frees the table", () => {
    const product = productsSeed.find(p => p.stock > 0)!;
    const id = useAppStore.getState().placeCustomerOrder(CUSTOMER_ID, TABLE_ID, [bottleLine(product.id)]);

    useAppStore.getState().updateCustomerOrderStatus(id, "paid", "cash");

    const table = useAppStore.getState().tables.find(t => t.id === TABLE_ID)!;
    expect(table.bill).toBe(0);
    expect(table.occupied).toBe(false);
  });

  it("keeps the table open when only one of two orders is paid", () => {
    const product = productsSeed.find(p => p.stock > 3)!;
    const first = useAppStore.getState().placeCustomerOrder(CUSTOMER_ID, TABLE_ID, [bottleLine(product.id)]);
    useAppStore.getState().placeCustomerOrder(CUSTOMER_ID, TABLE_ID, [bottleLine(product.id)]);

    useAppStore.getState().updateCustomerOrderStatus(first, "paid", "cash");

    const table = useAppStore.getState().tables.find(t => t.id === TABLE_ID)!;
    expect(table.bill).toBe(product.bottlePrice);
    expect(table.occupied).toBe(true);
  });

  it("never double-charges if paid is applied twice", () => {
    const product = productsSeed.find(p => p.stock > 0)!;
    const id = useAppStore.getState().placeCustomerOrder(CUSTOMER_ID, TABLE_ID, [bottleLine(product.id)]);

    useAppStore.getState().updateCustomerOrderStatus(id, "paid", "cash");
    useAppStore.getState().updateCustomerOrderStatus(id, "paid", "cash");

    expect(useAppStore.getState().sales).toHaveLength(1);
  });

  it("rejects an order that exceeds available stock with InventoryError", () => {
    const product = productsSeed.find(p => p.stock > 0)!;
    const overQty = product.stock + 1;

    expect(() => useAppStore.getState().placeCustomerOrder(CUSTOMER_ID, TABLE_ID, [bottleLine(product.id, overQty)]))
      .toThrow(InventoryError);

    // Nothing should have been mutated — no partial stock draw, no order row.
    expect(useAppStore.getState().customerOrders).toHaveLength(0);
    expect(useAppStore.getState().products.find(p => p.id === product.id)!.stock).toBe(product.stock);
  });
});
