import type { SupabaseClient } from "@supabase/supabase-js";

export type { SupabaseClient };

export class RepositoryError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = "RepositoryError";
  }
}

export function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

interface QueryResult<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

export async function safeQuery<T>(
  result: QueryResult<T> | PromiseLike<QueryResult<T>>
): Promise<T> {
  const resolved = await result;
  if (resolved.error) {
    throw new RepositoryError(resolved.error.message, resolved.error.code);
  }
  if (resolved.data === null) {
    throw new RepositoryError("No data returned from query");
  }
  return resolved.data as T;
}
