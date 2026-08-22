"use client";

import { useState } from "react";
import { Crown, Mail, ArrowLeft, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const { isDemoMode } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);

    if (isDemoMode) {
      await new Promise((r) => setTimeout(r, 500));
      setSuccess(true);
      setBusy(false);
      return;
    }

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (resetError) {
        setError(resetError.message);
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Unable to send reset email. Please try again later.");
    }
    setBusy(false);
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-mark"><Crown size={32} /></div>
          <strong>EMD</strong>
          <span>DRINKING SPORTS APP</span>
        </div>

        <h1>Reset Password</h1>
        <p className="auth-subtitle">Enter your email and we&apos;ll send you a reset link</p>

        {success ? (
          <div className="auth-success">
            <CheckCircle2 size={20} />
            <div>
              <strong>Reset link sent!</strong>
              <p>Check your email for instructions to reset your password.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <label className="auth-field">
              <Mail size={16} />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </label>

            {error && (
              <div className="auth-error">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button type="submit" className="auth-submit" disabled={busy}>
              {busy ? <><Loader2 className="auth-spinner" size={16} /> Sending…</> : "Send Reset Link"}
            </button>
          </form>
        )}

        <button className="auth-back" onClick={() => router.push("/login")}>
          <ArrowLeft size={16} /> Back to Sign In
        </button>

        {isDemoMode && (
          <div className="auth-demo">
            <small>DEMO MODE — Password reset is simulated. Contact your administrator to reset passwords.</small>
          </div>
        )}
      </div>
    </div>
  );
}
