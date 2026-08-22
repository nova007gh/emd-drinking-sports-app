import type { BarTable } from "@/lib/types";
import type { SupabaseClient } from "./base";
import { RepositoryError } from "./base";
import { mapTableFromDb } from "./mappers";

export class TablesRepository {
  constructor(private client: SupabaseClient) {}

  async getAll(): Promise<BarTable[]> {
    const { data, error } = await this.client.from("bar_tables").select("*").order("label");
    if (error) throw new RepositoryError(error.message, error.code);
    return (data as Record<string, unknown>[]).map(mapTableFromDb);
  }

  async toggleOccupied(id: string, occupied: boolean): Promise<void> {
    const { error } = await this.client.from("bar_tables").update({ occupied }).eq("id", id);
    if (error) throw new RepositoryError(error.message, error.code);
  }

  async transfer(fromId: string, toId: string): Promise<void> {
    const { error } = await this.client.rpc("transfer_table", { p_from_table: fromId, p_to_table: toId });
    if (error) throw new RepositoryError(error.message, error.code);
  }
}
