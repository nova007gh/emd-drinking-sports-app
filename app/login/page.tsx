"use client";

import { useState, useEffect } from "react";
import { Crown, Eye, EyeOff, Loader2, Lock, Mail, AlertCircle, ShieldCheck, Banknote, Users } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { signIn, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace("/");
  }, [isLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const result = await signIn(email, password);
    setBusy(false);
    if (result.error) {
      setError(result.error);
    } else {
      router.replace("/");
    }
  };

  const quickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError("");
    setBusy(true);
    const result = await signIn(demoEmail, demoPass);
    setBusy(false);
    if (result.error) {
      setError(result.error);
    } else {
      router.replace("/");
    }
  };

  if (isLoading) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-splash"><Loader2 className="auth-spinner" size={32} /></div>
          <p className="auth-loading-text">Loading EMD Drinking Sports…</p>
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

        <h1>Sign In</h1>
        <p className="auth-subtitle">Enter your credentials to access the dashboard</p>

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

          <label className="auth-field">
            <Lock size={16} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button type="button" className="auth-eye" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </label>

          {error && (
            <div className="auth-error">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={busy}>
            {busy ? <><Loader2 className="auth-spinner" size={16} /> Signing in…</> : "Sign In"}
          </button>

          <a className="auth-forgot" href="/forgot-password">Forgot password?</a>
        </form>

        <div className="auth-demo">
          <small>QUICK LOGIN — Tap a role to sign in instantly</small>
          <div className="auth-demo-buttons">
            <button type="button" onClick={() => quickLogin("owner@emd.com", "owner123")} disabled={busy}>
              <Crown size={14}/> Owner
            </button>
            <button type="button" onClick={() => quickLogin("manager@emd.com", "manager123")} disabled={busy}>
              <ShieldCheck size={14}/> Manager
            </button>
            <button type="button" onClick={() => quickLogin("cashier@emd.com", "cashier123")} disabled={busy}>
              <Banknote size={14}/> Cashier
            </button>
            <button type="button" onClick={() => quickLogin("waiter@emd.com", "waiter123")} disabled={busy}>
              <Users size={14}/> Waiter
            </button>
          </div>
          <div className="auth-demo-creds">
            <span>owner@emd.com / owner123</span>
            <span>manager@emd.com / manager123</span>
            <span>cashier@emd.com / cashier123</span>
            <span>waiter@emd.com / waiter123</span>
          </div>
        </div>
      </div>
    </div>
  );
}
