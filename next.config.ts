import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Dev-only: the dev server treats requests whose Origin differs from its own
  // host as cross-origin and rejects /_next/static/* with 403. Playwright and
  // LAN devices reach the app on 127.0.0.1, so allow it explicitly.
  allowedDevOrigins: ["127.0.0.1", "localhost"]
};

export default nextConfig;
