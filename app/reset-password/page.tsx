"use client";

import { useState } from "react";
import { Crown, Lock, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const { isDemoMode } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

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
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Unable to update password. Please try again.");
    }
    setBusy(false);
  };

  if (success) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-brand">
            <div className="auth-brand-mark"><Crown size={32} /></div>
            <strong>EMD</strong>
            <span>DRINKING SPORTS APP</span>
          </div>
          <div className="auth-success">
            <CheckCircle2 size={20} />
            <div>
              <strong>Password updated!</strong>
              <p>Your password has been changed successfully.</p>
            </div>
          </div>
          <button className="auth-submit" onClick={() => router.push("/login")}>
            Continue to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-mark"><Crown size={32} /></div>
          <strong>EMD</strong>
          <span>DRINKING SPORTS APP</span>
        </div>

        <h1>Set New Password</h1>
        <p className="auth-subtitle">Enter your new password below</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-field">
            <Lock size={16} />
            <input
              type="password"
              placeholder="New password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              autoFocus
            />
          </label>

          <label className="auth-field">
            <Lock size={16} />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </label>

          {error && (
            <div className="auth-error">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={busy}>
            {busy ? <><Loader2 className="auth-spinner" size={16} /> Updating…</> : "Update Password"}
          </button>
        </form>

        {isDemoMode && (
          <div className="auth-demo">
            <small>DEMO MODE — Password reset is simulated. Contact your administrator to reset passwords.</small>
          </div>
        )}
      </div>
    </div>
  );
}
