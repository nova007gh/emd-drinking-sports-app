import { describe, expect, it } from "vitest";
import { friendlyAuthError } from "@/lib/auth/context";

describe("friendlyAuthError", () => {
  // This is the message that appears when the deployment points at a Supabase
  // project that no longer exists (DNS NXDOMAIN) or is unreachable. supabase-js
  // says only "Failed to fetch", which tells a bar manager nothing.
  it("replaces 'Failed to fetch' with an actionable message", () => {
    const out = friendlyAuthError({ message: "Failed to fetch" });
    expect(out).not.toMatch(/failed to fetch/i);
    expect(out).toMatch(/cannot reach the sign-in server/i);
    expect(out.length).toBeGreaterThan(30);
  });

  it.each([
    ["Failed to fetch"],
    ["NetworkError when attempting to fetch resource."],
    ["Load failed"],
    ["fetch failed"],
    ["connect ECONNREFUSED 127.0.0.1:443"],
    ["getaddrinfo ENOT Found rlymvtgkdhvzhpqedlhl.supabase.co"]
  ])("maps network failure %j to the connection message", (message) => {
    expect(friendlyAuthError({ message })).toMatch(/cannot reach the sign-in server/i);
  });

  it("turns 'Invalid login credentials' into plain language", () => {
    expect(friendlyAuthError({ message: "Invalid login credentials" })).toBe(
      "Incorrect email or password."
    );
  });

  it("passes through genuine credential policy errors from Supabase", () => {
    const message = "Password should be at least 6 characters";
    expect(friendlyAuthError({ message })).toBe(message);
  });

  it("falls back when the error carries no message", () => {
    expect(friendlyAuthError({})).toBe("Sign in failed. Please try again.");
    expect(friendlyAuthError({ message: "" })).toBe("Sign in failed. Please try again.");
  });

  it("never leaks an internal URL or host into the user-facing text", () => {
    const out = friendlyAuthError({
      message: "Failed to fetch. https://rlymvtgkdhvzhpqedlhl.supabase.co/auth/v1/token"
    });
    expect(out).not.toMatch(/rlymvtgkdhvzhpqedlhl|supabase\.co|https?:\/\//i);
  });
});
