import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { readJsonBody, MAX_JSON_BODY_BYTES } from "@/lib/api/guards";

function req(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body)
  });
}

async function statusOf(result: { ok: boolean; response?: Response }) {
  return result.response ? result.response.status : null;
}

describe("readJsonBody", () => {
  it("accepts a JSON object", async () => {
    const r = await readJsonBody(req({ question: "hi" }));
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("should parse");
    expect(r.body.question).toBe("hi");
  });

  it("rejects malformed JSON with 400", async () => {
    const r = await readJsonBody(req("{not json"));
    expect(r.ok).toBe(false);
    expect(await statusOf(r as { ok: boolean; response?: Response })).toBe(400);
  });

  it("rejects a JSON array with 400 — the body must be an object", async () => {
    const r = await readJsonBody(req([1, 2, 3]));
    expect(r.ok).toBe(false);
    expect(await statusOf(r as { ok: boolean; response?: Response })).toBe(400);
  });

  it("rejects null with 400", async () => {
    const r = await readJsonBody(req("null"));
    expect(r.ok).toBe(false);
    expect(await statusOf(r as { ok: boolean; response?: Response })).toBe(400);
  });

  it("rejects a body over the cap with 413 using content-length", async () => {
    const r = await readJsonBody(
      req({ x: "y" }, { "content-length": String(MAX_JSON_BODY_BYTES + 1) })
    );
    expect(r.ok).toBe(false);
    expect(await statusOf(r as { ok: boolean; response?: Response })).toBe(413);
  });

  it("accepts a body exactly at the cap", async () => {
    const r = await readJsonBody(
      req({ x: "y" }, { "content-length": String(MAX_JSON_BODY_BYTES) })
    );
    expect(r.ok).toBe(true);
  });
});

describe("requireAuth", () => {
  const original = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "";
  });

  afterEach(() => {
    process.env = { ...original };
  });

  it("allows the request through in demo mode (Supabase unconfigured)", async () => {
    const { requireAuth } = await import("@/lib/api/guards");
    const r = await requireAuth();
    expect(r.ok).toBe(true);
  });

  it("rejects with 401 when Supabase is configured but the session is invalid", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-key";

    // Stub the server Supabase client's auth lookup so the test does not need
    // a live project: no session => no user.
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: async () => ({
        auth: { getUser: async () => ({ data: { user: null } }) }
      })
    }));

    const { requireAuth } = await import("@/lib/api/guards");
    const r = await requireAuth();
    expect(r.ok).toBe(false);
    expect(r.response?.status).toBe(401);
  });

  it("fails closed with 401 when the Supabase client throws", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-key";

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: async () => {
        throw new Error("cookies unavailable");
      }
    }));

    const { requireAuth } = await import("@/lib/api/guards");
    const r = await requireAuth();
    expect(r.ok).toBe(false);
    expect(r.response?.status).toBe(401);
  });
});
