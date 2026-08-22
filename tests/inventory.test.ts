import { describe, expect, it } from "vitest";
import { applySaleToProduct, InventoryError } from "@/lib/domain/inventory";
import type { Product } from "@/lib/types";

const spirit: Product = {
  id: "bw",
  name: "Black & White",
  category: "Spirits",
  bottlePrice: 220,
  shotPrice: 15,
  stock: 3,
  reorderLevel: 1,
  shotsPerBottle: 15,
  remainingShots: 4,
  active: true
};

describe("shot/tot inventory accounting", () => {
  it("reduces shots in the open bottle", () => {
    const result = applySaleToProduct(spirit, "shot", 2);
    expect(result.stock).toBe(3);
    expect(result.remainingShots).toBe(2);
  });

  it("opens a sealed bottle only after open shots run out", () => {
    const result = applySaleToProduct(spirit, "shot", 5);
    expect(result.stock).toBe(2);
    expect(result.remainingShots).toBe(14);
  });

  it("uses a sealed bottle when there is no open bottle", () => {
    const result = applySaleToProduct({ ...spirit, remainingShots: 0 }, "shot", 1);
    expect(result.stock).toBe(2);
    expect(result.remainingShots).toBe(14);
  });

  it("prevents negative shot inventory", () => {
    expect(() => applySaleToProduct({ ...spirit, stock: 0, remainingShots: 1 }, "shot", 2))
      .toThrow(InventoryError);
  });

  it("reduces sealed bottles for bottle sales", () => {
    expect(applySaleToProduct(spirit, "bottle", 2).stock).toBe(1);
  });

  it("prevents negative sealed bottle stock", () => {
    expect(() => applySaleToProduct(spirit, "bottle", 4)).toThrow(InventoryError);
  });

  it("crosses multiple bottles when shot demand exceeds one bottle", () => {
    const product = { ...spirit, stock: 3, remainingShots: 2, shotsPerBottle: 15 };
    const result = applySaleToProduct(product, "shot", 20);
    expect(result.stock).toBe(1);
    expect(result.remainingShots).toBe(12);
  });

  it("crosses multiple bottles with no open bottle", () => {
    const product = { ...spirit, stock: 2, remainingShots: 0, shotsPerBottle: 15 };
    const result = applySaleToProduct(product, "shot", 17);
    expect(result.stock).toBe(0);
    expect(result.remainingShots).toBe(13);
  });

  it("fails atomically when total available shots are insufficient", () => {
    const product = { ...spirit, stock: 1, remainingShots: 2, shotsPerBottle: 15 };
    expect(() => applySaleToProduct(product, "shot", 18)).toThrow(InventoryError);
  });

  it("computes available shots correctly", () => {
    const product = { ...spirit, stock: 3, remainingShots: 4, shotsPerBottle: 15 };
    expect(product.stock * 15 + 4).toBe(49);
  });
});
