"use client";

import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
  const router = useRouter();
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-mark"><ShieldAlert size={32} /></div>
          <strong>EMD</strong>
          <span>DRINKING SPORTS APP</span>
        </div>
        <h1>Access Denied</h1>
        <p className="auth-subtitle">You do not have permission to view this page. Contact your administrator if you believe this is an error.</p>
        <button className="auth-submit" onClick={() => router.replace("/")}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>
    </div>
  );
}
