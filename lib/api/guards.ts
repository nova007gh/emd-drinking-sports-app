import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/repositories/base";

/** Roughly what a legit client can send; anything larger is almost certainly abuse. */
export const MAX_JSON_BODY_BYTES = 128 * 1024;

export type GuardResult =
  | { ok: true; response?: undefined }
  | { ok: false; response: NextResponse };

/**
 * Authenticate an API request.
 *
 * Demo mode (Supabase env vars unset) has no user accounts, so there is
 * nothing to authenticate against and the request is allowed through — this
 * matches /api/sync, which acknowledges demo-mode operations before it checks
 * the session. That keeps local development and demo deployments working.
 *
 * In production mode a valid Supabase session is required.
 */
export async function requireAuth(): Promise<GuardResult> {
  if (!isSupabaseConfigured()) {
    return { ok: true };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      };
    }
    return { ok: true };
  } catch {
    // Never let a misconfigured server fail open in production mode.
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    };
  }
}

/**
 * Parse a JSON body with a hard cap on size.
 *
 * The OpenAI route builds a prompt from the request, so an unbounded body is
 * directly billable. Reject oversized payloads before parsing them.
 */
export async function readJsonBody(request: Request): Promise<
  { ok: true; body: Record<string, unknown> } | { ok: false; response: NextResponse }
> {
  const declared = request.headers.get("content-length");
  if (declared && Number(declared) > MAX_JSON_BODY_BYTES) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Request body too large" }, { status: 413 })
    };
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    };
  }

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Body must be a JSON object" }, { status: 400 })
    };
  }

  return { ok: true, body: body as Record<string, unknown> };
}
