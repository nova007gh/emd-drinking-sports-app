import type { NextConfig } from "next";

type RemotePatterns = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>;

/**
 * Product images live in the Supabase Storage `products` bucket, at
 * `${NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/products/...`.
 *
 * `next/image` refuses to optimize any remote host unless it is listed here,
 * so build the pattern from the configured project URL rather than hardcoding
 * a hostname. With the variable absent (demo mode) no pattern is added and the
 * ProductImage component renders with a plain <img> instead.
 */
function supabaseRemotePatterns(): RemotePatterns {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return [];

  try {
    const parsed = new URL(url);
    const protocol: "http" | "https" = parsed.protocol === "http:" ? "http" : "https";
    return [
      {
        protocol,
        hostname: parsed.hostname,
        pathname: "/storage/v1/object/public/**"
      }
    ];
  } catch {
    // A malformed URL must not take the build down; demo mode still works.
    return [];
  }
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: supabaseRemotePatterns()
  },
  // Dev-only: the dev server treats requests whose Origin differs from its own
  // host as cross-origin and rejects /_next/static/* with 403. Playwright and
  // LAN devices reach the app on 127.0.0.1, so allow it explicitly.
  allowedDevOrigins: ["127.0.0.1", "localhost"]
};

export default nextConfig;
