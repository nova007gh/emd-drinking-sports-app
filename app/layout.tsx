import type { Metadata } from "next";
import "./globals.css";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import { AuthProvider } from "@/lib/auth/context";

export const metadata: Metadata = {
  title: "EMD Drinking Sports App",
  description: "Sports bar and lounge management system",
  manifest: "/manifest.webmanifest"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning><AuthProvider><ServiceWorkerRegistration />{children}</AuthProvider></body>
    </html>
  );
}
