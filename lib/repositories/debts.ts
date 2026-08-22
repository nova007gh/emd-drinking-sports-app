import type { Debt, PaymentMethod } from "@/lib/types";
import type { SupabaseClient } from "./base";
import { RepositoryError } from "./base";
import { mapDebtFromDb } from "./mappers";
import { ghanaCedisToPesewas, pesewasToGhanaCedis } from "@/lib/domain/money";

export class DebtsRepository {
  constructor(private client: SupabaseClient) {}

  async getAll(): Promise<Debt[]> {
    const { data, error } = await this.client
      .from("debts")
      .select(`
        id, customer_id, order_id, original_amount_pesewas,
        outstanding_amount_pesewas, due_date, note, created_at,
        customers(name),
        debt_payments(id, amount_pesewas, payment_method, created_at)
      `)
      .order("created_at", { ascending: false });

    if (error) throw new RepositoryError(error.message, error.code);

    return (data as Record<string, unknown>[]).map((row) => {
      const customer = row.customers as Record<string, unknown> | null;
      const payments = (row.debt_payments as Record<string, unknown>[] ?? []).map((p) => ({
        id: p.id as string,
        debtId: row.id as string,
        amount: pesewasToGhanaCedis(p.amount_pesewas as number),
        paymentMethod: p.payment_method as PaymentMethod,
        createdAt: p.created_at as string
      }));
      return mapDebtFromDb({
        ...row,
        customer_name: customer?.name ?? ""
      }, payments);
    });
  }

  async create(customerId: string, amount: number, dueDate?: string, note?: string): Promise<Debt> {
    const { data, error } = await this.client.from("debts").insert({
      customer_id: customerId,
      original_amount_pesewas: ghanaCedisToPesewas(amount),
      outstanding_amount_pesewas: ghanaCedisToPesewas(amount),
      due_date: dueDate ?? null,
      note: note ?? null
    }).select().single();

    if (error) throw new RepositoryError(error.message, error.code);
    return mapDebtFromDb(data as unknown as Record<string, unknown>, []);
  }

  async payDebt(debtId: string, amount: number, paymentMethod: PaymentMethod, recordedBy: string): Promise<void> {
    const { error } = await this.client.rpc("apply_debt_payment", {
      p_debt_id: debtId,
      p_amount_pesewas: ghanaCedisToPesewas(amount),
      p_payment_method: paymentMethod === "gift" ? "gift_card" : paymentMethod,
      p_recorded_by: recordedBy
    });
    if (error) throw new RepositoryError(error.message, error.code);
  }
}
