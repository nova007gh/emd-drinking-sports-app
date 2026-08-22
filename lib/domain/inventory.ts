import type { Product, SaleMode } from "@/lib/types";

export class InventoryError extends Error {}

export function applySaleToProduct(product: Product, mode: SaleMode, quantity: number): Product {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new InventoryError("Quantity must be a positive integer.");
  }

  if (mode === "bottle") {
    if (product.stock < quantity) throw new InventoryError(`Insufficient bottle stock for ${product.name}.`);
    return { ...product, stock: product.stock - quantity };
  }

  if (!product.shotPrice || !product.shotsPerBottle) {
    throw new InventoryError(`${product.name} is not configured for shot/tot sales.`);
  }

  let stock = product.stock;
  let openShots = product.remainingShots ?? 0;

  for (let i = 0; i < quantity; i += 1) {
    if (openShots === 0) {
      if (stock <= 0) throw new InventoryError(`Insufficient shot inventory for ${product.name}.`);
      stock -= 1;
      openShots = product.shotsPerBottle;
    }
    openShots -= 1;
  }

  return { ...product, stock, remainingShots: openShots };
}

export function isLowStock(product: Product): boolean {
  return product.stock <= product.reorderLevel;
}

export function isHighStock(product: Product, allProducts: Product[]): boolean {
  const maxStock = Math.max(...allProducts.map((p) => p.stock));
  return product.stock >= maxStock * 0.8 && product.stock > product.reorderLevel * 3;
}

export function availableShots(product: Product): number {
  if (!product.shotsPerBottle) return 0;
  return (product.remainingShots ?? 0) + product.stock * product.shotsPerBottle;
}
