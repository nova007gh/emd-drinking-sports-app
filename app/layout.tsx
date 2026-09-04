import type { Metadata } from "next";
import "./globals.css";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import { AuthProvider } from "@/lib/auth/context";
import { ThemeInitializer } from "@/components/ThemeInitializer";

export const metadata: Metadata = {
  title: "EMD Drinking Sports App",
  description: "Sports bar and lounge management system",
  manifest: "/manifest.webmanifest"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning><AuthProvider><ThemeInitializer /><ServiceWorkerRegistration />{children}</AuthProvider></body>
    </html>
  );
}
