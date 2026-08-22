import type { WalletTransaction } from "@/lib/types";
import type { SupabaseClient } from "./base";
import { RepositoryError } from "./base";
import { pesewasToGhanaCedis } from "@/lib/domain/money";

export class WalletsRepository {
  constructor(private client: SupabaseClient) {}

  async getBalance(customerId: string): Promise<{ balance: number; points: number }> {
    const { data, error } = await this.client.from("wallets").select("balance_pesewas, points").eq("customer_id", customerId).single();
    if (error) {
      if (error.code === "PGRST116") return { balance: 0, points: 0 };
      throw new RepositoryError(error.message, error.code);
    }
    const row = data as Record<string, unknown>;
    return {
      balance: pesewasToGhanaCedis(row.balance_pesewas as number),
      points: (row.points as number) ?? 0
    };
  }

  async adjustBalance(customerId: string, amountDelta: number, reason: string, orderId?: string): Promise<void> {
    const { data: wallet } = await this.client.from("wallets").select("balance_pesewas").eq("customer_id", customerId).single();
    const currentBalance = (wallet as Record<string, unknown>)?.balance_pesewas as number ?? 0;
    const newBalance = currentBalance + Math.round(amountDelta * 100);
    if (newBalance < 0) throw new RepositoryError("Wallet cannot go negative");

    const { error: updateError } = await this.client.from("wallets").update({
      balance_pesewas: newBalance,
      updated_at: new Date().toISOString()
    }).eq("customer_id", customerId);
    if (updateError) throw new RepositoryError(updateError.message, updateError.code);

    const { error: txError } = await this.client.from("wallet_transactions").insert({
      customer_id: customerId,
      amount_delta_pesewas: Math.round(amountDelta * 100),
      points_delta: 0,
      reason,
      order_id: orderId ?? null
    });
    if (txError) throw new RepositoryError(txError.message, txError.code);
  }

  async adjustPoints(customerId: string, pointsDelta: number, reason: string, orderId?: string): Promise<void> {
    const { data: wallet } = await this.client.from("wallets").select("points").eq("customer_id", customerId).single();
    const currentPoints = (wallet as Record<string, unknown>)?.points as number ?? 0;
    const newPoints = currentPoints + pointsDelta;
    if (newPoints < 0) throw new RepositoryError("Loyalty points cannot go negative");

    const { error: updateError } = await this.client.from("wallets").update({
      points: newPoints,
      updated_at: new Date().toISOString()
    }).eq("customer_id", customerId);
    if (updateError) throw new RepositoryError(updateError.message, updateError.code);

    const { error: txError } = await this.client.from("wallet_transactions").insert({
      customer_id: customerId,
      amount_delta_pesewas: 0,
      points_delta: pointsDelta,
      reason,
      order_id: orderId ?? null
    });
    if (txError) throw new RepositoryError(txError.message, txError.code);
  }

  async getTransactions(customerId: string, limit = 50): Promise<WalletTransaction[]> {
    const { data, error } = await this.client
      .from("wallet_transactions")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new RepositoryError(error.message, error.code);
    return (data as Record<string, unknown>[]).map((row) => ({
      id: row.id as string,
      customerId: row.customer_id as string,
      amountDelta: pesewasToGhanaCedis(row.amount_delta_pesewas as number),
      pointsDelta: (row.points_delta as number) ?? 0,
      reason: row.reason as string,
      createdAt: row.created_at as string
    }));
  }
}
