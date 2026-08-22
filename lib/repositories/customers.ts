import type { Customer } from "@/lib/types";
import type { SupabaseClient } from "./base";
import { safeQuery, RepositoryError } from "./base";
import { mapCustomerFromDb, mapCustomerToDb } from "./mappers";

export class CustomersRepository {
  constructor(private client: SupabaseClient) {}

  async getAll(): Promise<Customer[]> {
    const { data, error } = await this.client
      .from("customers")
      .select(`
        id, name, phone, loyalty_points, created_at,
        wallets(balance_pesewas, points),
        debts(outstanding_amount_pesewas)
      `)
      .order("name");

    if (error) throw new RepositoryError(error.message, error.code);

    return (data as Record<string, unknown>[]).map((row) => {
      const wallet = row.wallets as Record<string, unknown> | null;
      const debts = row.debts as Record<string, unknown>[] | null;
      return mapCustomerFromDb({
        ...row,
        wallet_balance_pesewas: wallet?.balance_pesewas ?? 0,
        loyalty_points: wallet?.points ?? row.loyalty_points ?? 0,
        debt_pesewas: debts?.reduce((sum, d) => sum + (d.outstanding_amount_pesewas as number), 0) ?? 0
      });
    });
  }

  async create(name: string, phone: string): Promise<Customer> {
    const row = mapCustomerToDb({ name, phone });
    const data = await safeQuery(this.client.from("customers").insert(row).select().single());
    const customer = mapCustomerFromDb(data as unknown as Record<string, unknown>);
    await this.client.from("wallets").insert({ customer_id: customer.id, balance_pesewas: 0, points: 0 });
    return customer;
  }

  async updateWallet(customerId: string, amountDelta: number): Promise<void> {
    const { data: wallet } = await this.client.from("wallets").select("balance_pesewas").eq("customer_id", customerId).single();
    const currentBalance = (wallet as Record<string, unknown>)?.balance_pesewas as number ?? 0;
    const newBalance = currentBalance + amountDelta;
    if (newBalance < 0) throw new RepositoryError("Wallet cannot go negative");
    const { error } = await this.client.from("wallets").update({ balance_pesewas: newBalance, updated_at: new Date().toISOString() }).eq("customer_id", customerId);
    if (error) throw new RepositoryError(error.message, error.code);
  }

  async updateLoyaltyPoints(customerId: string, pointsDelta: number): Promise<void> {
    const { data: wallet } = await this.client.from("wallets").select("points").eq("customer_id", customerId).single();
    const currentPoints = (wallet as Record<string, unknown>)?.points as number ?? 0;
    const newPoints = currentPoints + pointsDelta;
    if (newPoints < 0) throw new RepositoryError("Loyalty points cannot go negative");
    const { error } = await this.client.from("wallets").update({ points: newPoints, updated_at: new Date().toISOString() }).eq("customer_id", customerId);
    if (error) throw new RepositoryError(error.message, error.code);
  }
}
