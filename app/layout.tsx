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
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('emd-theme');if(t){document.documentElement.setAttribute('data-theme',t)}}catch(e){}})()` }} />
      </head>
      <body suppressHydrationWarning><AuthProvider><ServiceWorkerRegistration />{children}</AuthProvider></body>
    </html>
  );
}
