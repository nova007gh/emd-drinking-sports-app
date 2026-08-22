import { describe, expect, it } from "vitest";
import { hasPermission } from "@/lib/auth/roles";

describe("role authorization", () => {
  it("owner can manage staff", () => {
    expect(hasPermission("owner", "manage_staff")).toBe(true);
  });

  it("cashier cannot manage staff", () => {
    expect(hasPermission("cashier", "manage_staff")).toBe(false);
  });

  it("waiter can sell but cannot manage inventory", () => {
    expect(hasPermission("waiter", "sell")).toBe(true);
    expect(hasPermission("waiter", "manage_inventory")).toBe(false);
  });
});
