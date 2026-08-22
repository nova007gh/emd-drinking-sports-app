import type { Product, StockMovement } from "@/lib/types";
import type { SupabaseClient } from "./base";
import { safeQuery, RepositoryError } from "./base";
import { mapProductFromDb, mapProductToDb, mapStockMovementFromDb } from "./mappers";

export class ProductsRepository {
  constructor(private client: SupabaseClient) {}

  async getAll(): Promise<Product[]> {
    const data = await safeQuery(this.client.from("products").select("*").order("name"));
    return (data as Record<string, unknown>[]).map(mapProductFromDb);
  }

  async getById(id: string): Promise<Product | null> {
    const { data, error } = await this.client.from("products").select("*").eq("id", id).single();
    if (error) {
      if (error.code === "PGRST116") return null;
      throw new RepositoryError(error.message, error.code);
    }
    return data ? mapProductFromDb(data as Record<string, unknown>) : null;
  }

  async create(product: Omit<Product, "id" | "active">): Promise<Product> {
    const row = mapProductToDb(product);
    const data = await safeQuery(this.client.from("products").insert(row).select().single());
    return mapProductFromDb(data as unknown as Record<string, unknown>);
  }

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.stock != null) dbUpdates.sealed_bottle_stock = updates.stock;
    if (updates.remainingShots != null) dbUpdates.open_bottle_shots_remaining = updates.remainingShots;
    if (updates.reorderLevel != null) dbUpdates.reorder_level = updates.reorderLevel;
    if (updates.active != null) dbUpdates.active = updates.active;
    if (updates.shotsPerBottle != null) dbUpdates.shots_per_bottle = updates.shotsPerBottle;

    const data = await safeQuery(this.client.from("products").update(dbUpdates).eq("id", id).select().single());
    return mapProductFromDb(data as unknown as Record<string, unknown>);
  }

  async toggleActive(id: string, active: boolean): Promise<void> {
    const { error } = await this.client.from("products").update({ active, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) throw new RepositoryError(error.message, error.code);
  }

  async getStockMovements(productId?: string, limit = 50): Promise<StockMovement[]> {
    let query = this.client.from("stock_movements").select(`
      id, movement_type, bottle_delta, shot_delta, reason, created_at,
      product_id, products(name)
    `).order("created_at", { ascending: false }).limit(limit);
    if (productId) query = query.eq("product_id", productId);
    const { data, error } = await query;
    if (error) throw new RepositoryError(error.message, error.code);
    return (data as Record<string, unknown>[]).map((row) => {
      const product = row.products as Record<string, unknown>;
      return mapStockMovementFromDb({ ...row, product_name: product?.name ?? "" });
    });
  }
}
