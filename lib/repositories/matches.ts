import type { Match } from "@/lib/types";
import type { SupabaseClient } from "./base";
import { safeQuery, RepositoryError } from "./base";
import { mapMatchFromDb } from "./mappers";

export class MatchesRepository {
  constructor(private client: SupabaseClient) {}

  async getAll(): Promise<Match[]> {
    const { data, error } = await this.client.from("matches").select("*").order("starts_at", { ascending: true });
    if (error) throw new RepositoryError(error.message, error.code);
    return (data as Record<string, unknown>[]).map(mapMatchFromDb);
  }

  async getActive(): Promise<Match[]> {
    const { data, error } = await this.client.from("matches").select("*").eq("active", true).order("starts_at", { ascending: true });
    if (error) throw new RepositoryError(error.message, error.code);
    return (data as Record<string, unknown>[]).map(mapMatchFromDb);
  }

  async create(input: { homeTeam: string; awayTeam: string; startsAt: string; promotionText?: string }): Promise<Match> {
    const data = await safeQuery(this.client.from("matches").insert({
      home_team: input.homeTeam,
      away_team: input.awayTeam,
      starts_at: input.startsAt,
      promotion_text: input.promotionText ?? null,
      active: true
    }).select().single());
    return mapMatchFromDb(data as unknown as Record<string, unknown>);
  }

  async toggleActive(id: string, active: boolean): Promise<void> {
    const { error } = await this.client.from("matches").update({ active }).eq("id", id);
    if (error) throw new RepositoryError(error.message, error.code);
  }
}
