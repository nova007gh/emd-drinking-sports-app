import { describe, it, expect } from "vitest";
import {
  mapProductFromDb,
  mapProductToDb,
  mapCustomerFromDb,
  mapCustomerToDb,
  mapTableFromDb,
  mapSaleFromDb,
  mapGiftCardFromDb,
  mapDebtFromDb,
  mapExpenseFromDb,
  mapMatchFromDb,
  mapStockMovementFromDb
} from "@/lib/repositories/mappers";
import type { CartLine } from "@/lib/types";

describe("repository data mappers", () => {
  describe("mapProductFromDb", () => {
    it("maps a beer product correctly", () => {
      const row = {
        id: "p1",
        name: "Club Beer",
        category: "beer",
        bottle_price_pesewas: 1800,
        shot_price_pesewas: null,
        sealed_bottle_stock: 32,
        shots_per_bottle: null,
        open_bottle_shots_remaining: 0,
        reorder_level: 10,
        active: true
      };
      const product = mapProductFromDb(row);
      expect(product.id).toBe("p1");
      expect(product.name).toBe("Club Beer");
      expect(product.category).toBe("Beer");
      expect(product.bottlePrice).toBe(18);
      expect(product.shotPrice).toBeUndefined();
      expect(product.stock).toBe(32);
      expect(product.active).toBe(true);
    });

    it("maps a spirit product with shot pricing", () => {
      const row = {
        id: "p4",
        name: "Black & White",
        category: "spirits",
        bottle_price_pesewas: 22000,
        shot_price_pesewas: 1500,
        sealed_bottle_stock: 8,
        shots_per_bottle: 15,
        open_bottle_shots_remaining: 10,
        reorder_level: 3,
        active: true
      };
      const product = mapProductFromDb(row);
      expect(product.bottlePrice).toBe(220);
      expect(product.shotPrice).toBe(15);
      expect(product.shotsPerBottle).toBe(15);
      expect(product.remainingShots).toBe(10);
    });

    it("maps unknown category to Soft Drinks fallback", () => {
      const row = {
        id: "p99",
        name: "Unknown",
        category: "other",
        bottle_price_pesewas: 500,
        shot_price_pesewas: null,
        sealed_bottle_stock: 10,
        shots_per_bottle: null,
        open_bottle_shots_remaining: 0,
        reorder_level: 5,
        active: true
      };
      const product = mapProductFromDb(row);
      expect(product.category).toBe("Soft Drinks");
    });
  });

  describe("mapProductToDb", () => {
    it("converts domain product to DB row with pesewas", () => {
      const product = {
        name: "Guinness",
        category: "Beer" as const,
        bottlePrice: 20,
        shotPrice: undefined,
        stock: 24,
        shotsPerBottle: undefined,
        remainingShots: 0,
        reorderLevel: 10
      };
      const row = mapProductToDb(product);
      expect(row.name).toBe("Guinness");
      expect(row.category).toBe("beer");
      expect(row.bottle_price_pesewas).toBe(2000);
      expect(row.shot_price_pesewas).toBeNull();
      expect(row.sealed_bottle_stock).toBe(24);
    });

    it("converts spirit with shot pricing", () => {
      const product = {
        name: "Hennessy",
        category: "Spirits" as const,
        bottlePrice: 300,
        shotPrice: 22,
        stock: 3,
        shotsPerBottle: 15,
        remainingShots: 9,
        reorderLevel: 3
      };
      const row = mapProductToDb(product);
      expect(row.bottle_price_pesewas).toBe(30000);
      expect(row.shot_price_pesewas).toBe(2200);
      expect(row.shots_per_bottle).toBe(15);
    });
  });

  describe("mapCustomerFromDb", () => {
    it("maps customer with wallet and debt", () => {
      const row = {
        id: "c1",
        name: "Kwame Asare",
        phone: "0240000001",
        total_spent_pesewas: 96000,
        debt_pesewas: 56000,
        loyalty_points: 96,
        wallet_balance_pesewas: 5000,
        visit_count: 24,
        last_purchase_date: "2026-08-18T00:00:00.000Z"
      };
      const customer = mapCustomerFromDb(row);
      expect(customer.name).toBe("Kwame Asare");
      expect(customer.totalSpent).toBe(960);
      expect(customer.debt).toBe(560);
      expect(customer.walletBalance).toBe(50);
      expect(customer.loyaltyPoints).toBe(96);
    });

    it("handles missing wallet/debt fields with defaults", () => {
      const row = { id: "c2", name: "New Customer", phone: "0240" };
      const customer = mapCustomerFromDb(row);
      expect(customer.totalSpent).toBe(0);
      expect(customer.debt).toBe(0);
      expect(customer.walletBalance).toBe(0);
      expect(customer.loyaltyPoints).toBe(0);
    });
  });

  describe("mapCustomerToDb", () => {
    it("converts customer to DB row", () => {
      const row = mapCustomerToDb({ name: "Test", phone: "0241234567" });
      expect(row.name).toBe("Test");
      expect(row.phone).toBe("0241234567");
    });
  });

  describe("mapTableFromDb", () => {
    it("maps an occupied table", () => {
      const row = { id: "t1", label: "Table 1", occupied: true, bill_pesewas: 12000 };
      const table = mapTableFromDb(row);
      expect(table.name).toBe("Table 1");
      expect(table.occupied).toBe(true);
      expect(table.bill).toBe(120);
    });

    it("maps an available table with no bill", () => {
      const row = { id: "t2", label: "Table 2", occupied: false };
      const table = mapTableFromDb(row);
      expect(table.occupied).toBe(false);
      expect(table.bill).toBe(0);
    });
  });

  describe("mapSaleFromDb", () => {
    it("maps a completed sale with lines", () => {
      const lines: CartLine[] = [
        { id: "l1", productId: "p1", name: "Club Beer", mode: "bottle", unitPrice: 18, quantity: 3 }
      ];
      const row = {
        id: "s1",
        total_pesewas: 5400,
        payment_method: "cash",
        payment_status: "successful",
        created_at: "2026-08-19T00:00:00.000Z",
        discount_pesewas: 0,
        status: "paid",
        table_id: "t1",
        customer_id: "c1",
        opened_by: "u1"
      };
      const sale = mapSaleFromDb(row, lines);
      expect(sale.total).toBe(54);
      expect(sale.paymentMethod).toBe("cash");
      expect(sale.paymentStatus).toBe("successful");
      expect(sale.lines).toBe(lines);
      expect(sale.voided).toBe(false);
    });

    it("maps a voided sale", () => {
      const row = {
        id: "s2",
        total_pesewas: 10000,
        payment_method: "momo",
        payment_status: "reversed",
        created_at: "2026-08-19T00:00:00.000Z",
        discount_pesewas: 0,
        status: "voided"
      };
      const sale = mapSaleFromDb(row, []);
      expect(sale.voided).toBe(true);
      expect(sale.paymentMethod).toBe("momo");
    });

    it("maps gift_card payment method to gift", () => {
      const row = {
        id: "s3",
        total_pesewas: 5000,
        payment_method: "gift_card",
        payment_status: "successful",
        created_at: "2026-08-19T00:00:00.000Z",
        discount_pesewas: 0,
        status: "paid"
      };
      const sale = mapSaleFromDb(row, []);
      expect(sale.paymentMethod).toBe("gift");
    });
  });

  describe("mapGiftCardFromDb", () => {
    it("maps an active gift card", () => {
      const row = {
        id: "g1",
        display_suffix: "EMD-ABC123-DEF456",
        balance_pesewas: 10000,
        status: "active",
        expiry_date: "2026-12-31",
        created_at: "2026-08-19T00:00:00.000Z"
      };
      const card = mapGiftCardFromDb(row);
      expect(card.code).toBe("EMD-ABC123-DEF456");
      expect(card.balance).toBe(100);
      expect(card.status).toBe("active");
    });
  });

  describe("mapDebtFromDb", () => {
    it("maps a debt with payments", () => {
      const payments = [
        { id: "dp1", debtId: "d1", amount: 50, paymentMethod: "cash" as const, createdAt: "2026-08-19T00:00:00.000Z" }
      ];
      const row = {
        id: "d1",
        customer_id: "c1",
        customer_name: "Kwame",
        original_amount_pesewas: 56000,
        outstanding_amount_pesewas: 51000,
        due_date: "2026-08-15",
        note: null,
        created_at: "2026-08-10T00:00:00.000Z"
      };
      const debt = mapDebtFromDb(row, payments);
      expect(debt.customerName).toBe("Kwame");
      expect(debt.originalAmount).toBe(560);
      expect(debt.outstandingAmount).toBe(510);
      expect(debt.payments.length).toBe(1);
    });
  });

  describe("mapExpenseFromDb", () => {
    it("maps an expense", () => {
      const row = {
        id: "e1",
        title: "Ice",
        amount_pesewas: 5000,
        category: "supplies",
        created_at: "2026-08-19T00:00:00.000Z",
        recorded_by: "u1"
      };
      const expense = mapExpenseFromDb(row);
      expect(expense.title).toBe("Ice");
      expect(expense.amount).toBe(50);
      expect(expense.category).toBe("supplies");
    });
  });

  describe("mapMatchFromDb", () => {
    it("maps a football match", () => {
      const row = {
        id: "m1",
        home_team: "Chelsea",
        away_team: "Liverpool",
        starts_at: "2026-08-20T15:00:00.000Z",
        promotion_text: "Big match",
        active: true
      };
      const match = mapMatchFromDb(row);
      expect(match.homeTeam).toBe("Chelsea");
      expect(match.awayTeam).toBe("Liverpool");
      expect(match.active).toBe(true);
    });
  });

  describe("mapStockMovementFromDb", () => {
    it("maps a sale_bottle movement", () => {
      const row = {
        id: "sm1",
        product_id: "p1",
        product_name: "Club Beer",
        movement_type: "sale_bottle",
        bottle_delta: -3,
        shot_delta: 0,
        reason: "POS checkout",
        created_at: "2026-08-19T00:00:00.000Z"
      };
      const movement = mapStockMovementFromDb(row);
      expect(movement.productId).toBe("p1");
      expect(movement.productName).toBe("Club Beer");
      expect(movement.movementType).toBe("sale_bottle");
      expect(movement.bottleDelta).toBe(-3);
    });

    it("maps an open_for_shots movement", () => {
      const row = {
        id: "sm2",
        product_id: "p4",
        product_name: "Black & White",
        movement_type: "open_for_shots",
        bottle_delta: -1,
        shot_delta: 15,
        reason: "Opened for shots",
        created_at: "2026-08-19T00:00:00.000Z"
      };
      const movement = mapStockMovementFromDb(row);
      expect(movement.movementType).toBe("open_for_shots");
      expect(movement.shotDelta).toBe(15);
    });
  });
});

describe("RepositoryFactory", () => {
  it("isSupabaseConfigured returns false when env vars not set", async () => {
    const { isSupabaseConfigured } = await import("@/lib/repositories/base");
    expect(isSupabaseConfigured()).toBe(false);
  });
});
