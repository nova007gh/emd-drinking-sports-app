import type { Expense } from "@/lib/types";
import type { SupabaseClient } from "./base";
import { safeQuery, RepositoryError } from "./base";
import { mapExpenseFromDb } from "./mappers";
import { ghanaCedisToPesewas } from "@/lib/domain/money";

export class ExpensesRepository {
  constructor(private client: SupabaseClient) {}

  async getAll(limit = 100): Promise<Expense[]> {
    const { data, error } = await this.client.from("expenses").select("*").order("created_at", { ascending: false }).limit(limit);
    if (error) throw new RepositoryError(error.message, error.code);
    return (data as Record<string, unknown>[]).map(mapExpenseFromDb);
  }

  async create(title: string, amount: number, category: string, recordedBy: string, note?: string): Promise<Expense> {
    const data = await safeQuery(this.client.from("expenses").insert({
      title,
      amount_pesewas: ghanaCedisToPesewas(amount),
      category,
      recorded_by: recordedBy,
      note: note ?? null
    }).select().single());
    return mapExpenseFromDb(data as unknown as Record<string, unknown>);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from("expenses").delete().eq("id", id);
    if (error) throw new RepositoryError(error.message, error.code);
  }
}
