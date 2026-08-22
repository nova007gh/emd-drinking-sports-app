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

import { useAppStore } from "@/lib/store";
import { customersSeed, debtsSeed, expensesSeed, giftCardsSeed, matchesSeed, productsSeed, salesSeed, staffSeed, tablesSeed } from "@/lib/seed";

function resetStore() {
  useAppStore.setState({
    products: productsSeed,
    customers: customersSeed,
    tables: tablesSeed,
    giftCards: giftCardsSeed,
    sales: salesSeed,
    expenses: expensesSeed,
    debts: debtsSeed,
    staff: staffSeed,
    matches: matchesSeed,
    cart: [],
    cartNote: "",
    discount: 0,
    selectedGiftCardCode: undefined,
    selectedCustomerId: undefined,
    selectedTableId: undefined,
    heldOrders: [],
    stockMovements: [],
    currentCashierId: "demo-owner"
  });
}

function findCustomerByPhone(phone: string) {
  return useAppStore.getState().customers.find((c) => c.phone === phone)!;
}

beforeEach(() => {
  localStorageMock.clear();
  resetStore();
});

describe("checkout total is exact", () => {
  it("computes total as sum of unit price * quantity", () => {
    const store = useAppStore.getState();
    store.addToCart("p1", "bottle");
    store.addToCart("p1", "bottle");
    store.addToCart("p8", "bottle");
    const result = store.checkout("cash");
    expect(result.total).toBe(18 * 2 + 10);
  });

  it("computes shot sale total exactly", () => {
    const store = useAppStore.getState();
    store.addToCart("p4", "shot");
    store.addToCart("p4", "shot");
    store.addToCart("p4", "shot");
    const result = store.checkout("cash");
    expect(result.total).toBe(15 * 3);
  });

  it("uses currentCashierId in sale record", () => {
    const store = useAppStore.getState();
    store.setCashierId("auth-user-123");
    store.addToCart("p1", "bottle");
    const result = store.checkout("cash");
    expect(result.sale.cashierId).toBe("auth-user-123");
  });

  it("defaults to demo-owner cashierId when not set", () => {
    resetStore();
    const store = useAppStore.getState();
    store.addToCart("p1", "bottle");
    const result = store.checkout("cash");
    expect(result.sale.cashierId).toBe("demo-owner");
  });
});

describe("discount math is exact", () => {
  it("subtracts discount from subtotal", () => {
    const store = useAppStore.getState();
    store.addToCart("p1", "bottle");
    store.addToCart("p1", "bottle");
    store.setDiscount(10);
    const result = store.checkout("cash");
    expect(result.total).toBe(18 * 2 - 10);
  });

  it("does not go negative when discount exceeds subtotal", () => {
    const store = useAppStore.getState();
    store.addToCart("p10", "bottle");
    store.setDiscount(100);
    const result = store.checkout("cash");
    expect(result.total).toBe(0);
  });
});

describe("debt partial payment", () => {
  it("reduces outstanding amount by payment", () => {
    const store = useAppStore.getState();
    store.addCustomer("Test", "0249999999");
    const customerId = findCustomerByPhone("0249999999").id;
    store.addDebt(customerId, 200);
    const debt = useAppStore.getState().debts[0];
    store.payDebt(debt.id, 80, "cash");
    const updated = useAppStore.getState().debts[0];
    expect(updated.outstandingAmount).toBe(120);
    expect(updated.payments.length).toBe(1);
    expect(updated.payments[0].amount).toBe(80);
  });

  it("debt cannot become negative", () => {
    const store = useAppStore.getState();
    store.addCustomer("Test2", "0249999998");
    const customerId = findCustomerByPhone("0249999998").id;
    store.addDebt(customerId, 100);
    const debt = useAppStore.getState().debts[0];
    store.payDebt(debt.id, 150, "cash");
    const updated = useAppStore.getState().debts[0];
    expect(updated.outstandingAmount).toBe(0);
    const customer = useAppStore.getState().customers.find((c) => c.id === customerId);
    expect(customer!.debt).toBe(0);
  });

  it("records multiple partial payments", () => {
    const store = useAppStore.getState();
    store.addCustomer("Test3", "0249999997");
    const customerId = findCustomerByPhone("0249999997").id;
    store.addDebt(customerId, 300);
    const debt = useAppStore.getState().debts[0];
    store.payDebt(debt.id, 100, "cash");
    store.payDebt(debt.id, 100, "momo");
    store.payDebt(debt.id, 100, "cash");
    const updated = useAppStore.getState().debts[0];
    expect(updated.outstandingAmount).toBe(0);
    expect(updated.payments.length).toBe(3);
  });
});

describe("gift card redemption", () => {
  it("partial redemption reduces balance", () => {
    const store = useAppStore.getState();
    const card = store.createGiftCard(200);
    const ok = store.redeemGiftCard(card.code, 50);
    expect(ok).toBe(true);
    const updated = useAppStore.getState().giftCards[0];
    expect(updated.balance).toBe(150);
    expect(updated.status).toBe("active");
  });

  it("gift card cannot overdraw", () => {
    const store = useAppStore.getState();
    const card = store.createGiftCard(100);
    const ok = store.redeemGiftCard(card.code, 150);
    expect(ok).toBe(false);
    const updated = useAppStore.getState().giftCards[0];
    expect(updated.balance).toBe(100);
  });

  it("expired gift card cannot redeem", () => {
    const store = useAppStore.getState();
    const card = store.createGiftCard(100);
    const cards = useAppStore.getState().giftCards;
    useAppStore.setState({
      giftCards: cards.map((g) => g.id === card.id ? { ...g, expiryDate: new Date(Date.now() - 86400000).toISOString() } : g)
    });
    const ok = store.redeemGiftCard(card.code, 50);
    expect(ok).toBe(false);
    const updated = useAppStore.getState().giftCards[0];
    expect(updated.status).toBe("expired");
  });

  it("full redemption marks card as redeemed", () => {
    const store = useAppStore.getState();
    const card = store.createGiftCard(100);
    const ok = store.redeemGiftCard(card.code, 100);
    expect(ok).toBe(true);
    const updated = useAppStore.getState().giftCards[0];
    expect(updated.balance).toBe(0);
    expect(updated.status).toBe("redeemed");
  });
});

describe("wallet operations", () => {
  it("wallet cannot overdraw via spendWallet", () => {
    const store = useAppStore.getState();
    store.addCustomer("WalletTest", "0249999996");
    const customerId = findCustomerByPhone("0249999996").id;
    store.topUpWallet(customerId, 50);
    const ok = store.spendWallet(customerId, 100);
    expect(ok).toBe(false);
    const customer = useAppStore.getState().customers.find((c) => c.id === customerId);
    expect(customer!.walletBalance).toBe(50);
  });

  it("wallet spend deducts correctly", () => {
    const store = useAppStore.getState();
    store.addCustomer("WalletTest2", "0249999995");
    const customerId = findCustomerByPhone("0249999995").id;
    store.topUpWallet(customerId, 100);
    const ok = store.spendWallet(customerId, 30);
    expect(ok).toBe(true);
    const customer = useAppStore.getState().customers.find((c) => c.id === customerId);
    expect(customer!.walletBalance).toBe(70);
  });

  it("checkout with wallet deducts from customer wallet", () => {
    const store = useAppStore.getState();
    store.addCustomer("WalletCheckout", "0249999994");
    const customerId = findCustomerByPhone("0249999994").id;
    store.topUpWallet(customerId, 100);
    store.selectCustomer(customerId);
    store.addToCart("p1", "bottle");
    const result = store.checkout("wallet");
    expect(result.sale.paymentStatus).toBe("successful");
    const customer = useAppStore.getState().customers.find((c) => c.id === customerId);
    expect(customer!.walletBalance).toBe(100 - 18);
  });

  it("checkout with wallet fails when balance insufficient", () => {
    const store = useAppStore.getState();
    store.addCustomer("WalletCheckoutFail", "0249999993");
    const customerId = findCustomerByPhone("0249999993").id;
    store.topUpWallet(customerId, 5);
    store.selectCustomer(customerId);
    store.addToCart("p1", "bottle");
    expect(() => store.checkout("wallet")).toThrow();
  });

  it("checkout with wallet requires a customer", () => {
    const store = useAppStore.getState();
    store.addToCart("p1", "bottle");
    expect(() => store.checkout("wallet")).toThrow();
  });
});

describe("loyalty points", () => {
  it("loyalty cannot become negative via spendLoyaltyPoints", () => {
    const store = useAppStore.getState();
    store.addCustomer("LoyaltyTest", "0249999992");
    const customerId = findCustomerByPhone("0249999992").id;
    const ok = store.spendLoyaltyPoints(customerId, 10);
    expect(ok).toBe(false);
    const customer = useAppStore.getState().customers.find((c) => c.id === customerId);
    expect(customer!.loyaltyPoints).toBe(0);
  });

  it("spendLoyaltyPoints deducts correctly", () => {
    const store = useAppStore.getState();
    store.addCustomer("LoyaltyTest2", "0249999991");
    const customerId = findCustomerByPhone("0249999991").id;
    useAppStore.setState({
      customers: useAppStore.getState().customers.map((c) => c.id === customerId ? { ...c, loyaltyPoints: 50 } : c)
    });
    const ok = store.spendLoyaltyPoints(customerId, 20);
    expect(ok).toBe(true);
    const customer = useAppStore.getState().customers.find((c) => c.id === customerId);
    expect(customer!.loyaltyPoints).toBe(30);
  });

  it("checkout awards loyalty points", () => {
    const store = useAppStore.getState();
    store.addCustomer("LoyaltyAward", "0249999990");
    const customerId = findCustomerByPhone("0249999990").id;
    store.selectCustomer(customerId);
    store.addToCart("p1", "bottle");
    store.addToCart("p1", "bottle");
    store.checkout("cash");
    const customer = useAppStore.getState().customers.find((c) => c.id === customerId);
    expect(customer!.loyaltyPoints).toBe(Math.floor(36 / 10));
  });
});

describe("audit record creation", () => {
  it("bottle checkout creates a sale_bottle stock movement", () => {
    const store = useAppStore.getState();
    store.addToCart("p1", "bottle");
    store.addToCart("p1", "bottle");
    store.checkout("cash");
    const movements = useAppStore.getState().stockMovements;
    const bottleMovement = movements.find((m) => m.movementType === "sale_bottle");
    expect(bottleMovement).toBeDefined();
    expect(bottleMovement!.bottleDelta).toBe(-2);
    expect(bottleMovement!.productId).toBe("p1");
  });

  it("shot checkout creates adjustment_out and open_for_shots movements", () => {
    const store = useAppStore.getState();
    store.addToCart("p4", "shot");
    store.addToCart("p4", "shot");
    store.checkout("cash");
    const movements = useAppStore.getState().stockMovements;
    const shotMovement = movements.find((m) => m.movementType === "adjustment_out");
    expect(shotMovement).toBeDefined();
    expect(shotMovement!.shotDelta).toBe(-2);
  });

  it("addStock creates a purchase movement", () => {
    const store = useAppStore.getState();
    store.addStock("p1", 10);
    const movements = useAppStore.getState().stockMovements;
    const purchase = movements.find((m) => m.movementType === "purchase");
    expect(purchase).toBeDefined();
    expect(purchase!.bottleDelta).toBe(10);
  });

  it("adjustStock creates an adjustment movement", () => {
    const store = useAppStore.getState();
    store.adjustStock("p1", -3, "Damaged stock");
    const movements = useAppStore.getState().stockMovements;
    const adj = movements.find((m) => m.movementType === "adjustment_out");
    expect(adj).toBeDefined();
    expect(adj!.bottleDelta).toBe(-3);
    expect(adj!.reason).toBe("Damaged stock");
  });
});

describe("gift card checkout integration", () => {
  it("checkout with gift card deducts from card balance", () => {
    const store = useAppStore.getState();
    const card = store.createGiftCard(200);
    store.selectGiftCardCode(card.code);
    store.addToCart("p1", "bottle");
    store.addToCart("p1", "bottle");
    const result = store.checkout("gift");
    expect(result.sale.paymentStatus).toBe("successful");
    const updated = useAppStore.getState().giftCards[0];
    expect(updated.balance).toBe(200 - 36);
  });

  it("checkout with gift card fails when balance insufficient", () => {
    const store = useAppStore.getState();
    const card = store.createGiftCard(10);
    store.selectGiftCardCode(card.code);
    store.addToCart("p1", "bottle");
    expect(() => store.checkout("gift")).toThrow();
  });

  it("checkout with gift card requires a code", () => {
    const store = useAppStore.getState();
    store.addToCart("p1", "bottle");
    expect(() => store.checkout("gift")).toThrow();
  });
});

describe("splitBill", () => {
  it("creates a new sale with selected lines", () => {
    const store = useAppStore.getState();
    store.addToCart("p1", "bottle");
    store.addToCart("p1", "bottle");
    store.addToCart("p8", "bottle");
    store.selectTable("t7");
    const result = store.checkout("cash");
    const originalSaleId = result.sale.id;

    // Split: move the first line (p1-bottle) to a new bill
    const lineToMove = result.sale.lines[0].id;
    const newSaleId = store.splitBill("t7", [lineToMove]);
    expect(newSaleId).not.toBeNull();

    const state = useAppStore.getState();
    const newSale = state.sales.find(s => s.id === newSaleId);
    const originalSale = state.sales.find(s => s.id === originalSaleId);
    expect(newSale).toBeDefined();
    expect(originalSale).toBeDefined();
    expect(newSale!.lines.length).toBe(1);
    expect(originalSale!.lines.length).toBe(1); // p8-bottle remains
  });

  it("returns null when no active sale on table", () => {
    const store = useAppStore.getState();
    const result = store.splitBill("t10", ["fake-line"]);
    expect(result).toBeNull();
  });

  it("returns null when no line IDs provided", () => {
    const store = useAppStore.getState();
    store.addToCart("p1", "bottle");
    store.selectTable("t8");
    store.checkout("cash");
    const result = store.splitBill("t8", []);
    expect(result).toBeNull();
  });

  it("calculates correct totals after split", () => {
    const store = useAppStore.getState();
    store.addToCart("p1", "bottle"); // 18
    store.addToCart("p8", "bottle"); // 10
    store.selectTable("t11");
    const result = store.checkout("cash");
    const lineIds = result.sale.lines.map(l => l.id);
    const newSaleId = store.splitBill("t11", [lineIds[0]]);

    const state = useAppStore.getState();
    const newSale = state.sales.find(s => s.id === newSaleId);
    const originalSale = state.sales.find(s => s.id === result.sale.id);
    expect(newSale!.total).toBe(18);
    expect(originalSale!.total).toBe(10);
  });
});

describe("football table reservations", () => {
  it("reserveTableForMatch adds table to reserved list", () => {
    const store = useAppStore.getState();
    const matchId = store.matches[0].id;
    store.reserveTableForMatch(matchId, "t1");
    const match = useAppStore.getState().matches.find(m => m.id === matchId);
    expect(match?.reservedTables).toContain("t1");
  });

  it("reserveTableForMatch does not duplicate", () => {
    const store = useAppStore.getState();
    const matchId = store.matches[0].id;
    store.reserveTableForMatch(matchId, "t2");
    store.reserveTableForMatch(matchId, "t2");
    const match = useAppStore.getState().matches.find(m => m.id === matchId);
    expect(match?.reservedTables?.filter(t => t === "t2").length).toBe(1);
  });

  it("unreserveTableForMatch removes table from reserved list", () => {
    const store = useAppStore.getState();
    const matchId = store.matches[0].id;
    store.reserveTableForMatch(matchId, "t3");
    store.unreserveTableForMatch(matchId, "t3");
    const match = useAppStore.getState().matches.find(m => m.id === matchId);
    expect(match?.reservedTables).not.toContain("t3");
  });

  it("new matches start with empty reserved tables", () => {
    const store = useAppStore.getState();
    store.addMatch("Team A", "Team B", new Date().toISOString());
    const lastMatch = useAppStore.getState().matches[useAppStore.getState().matches.length - 1];
    expect(lastMatch.reservedTables).toEqual([]);
  });
});
