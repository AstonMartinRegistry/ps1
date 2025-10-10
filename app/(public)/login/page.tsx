"use client";

import { getBrowserSupabase } from "@/lib/supabase/browser";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const supabase = getBrowserSupabase();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pwEmail, setPwEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  // Only allow stanford.edu (including subdomains like cs.stanford.edu)
  const isStanfordEmail = (value: string) => /@([^.]+\.)?stanford\.edu$/i.test(value.trim());

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const err = url.searchParams.get("error");
      if (err === "restricted") setStatus("hold your horses");
    } catch {}
  }, []);

  async function onEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending code...");
    if (!isStanfordEmail(email)) {
      setStatus("hold your horses");
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });
    if (error) {
      setStatus(error.message);
      return;
    }
    setStatus("we sent a 6-digit code to your email");
    setStep("otp");
  }

  async function onOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clean = code.replace(/\D+/g, "").slice(0, 6);
    if (clean.length !== 6) {
      setStatus("enter the 6-digit code");
      return;
    }
    setStatus("verifying...");
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: clean,
      type: "email",
    });
    if (error) {
      setStatus(error.message);
      return;
    }
    setStatus(null);
    // After verifying via OTP, always go to portal; modal will prompt to set password if needed
    window.location.href = "/";
  }

  return (
    <div className="hero">
      <div className="hero-group">
        <h1 className="hero-title">welcome to the registry</h1>
        <p style={{ maxWidth: 640, textAlign: "center", color: "#cbd5e1", margin: 0 }}>
          find anyone in 5 seconds. search across public signals with precision.
        </p>

        {step === "email" ? (
          <form className="search-box" onSubmit={onEmailSubmit}>
            <input
              className="search-input"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div style={{ height: 8 }} />
            <button className="btn" type="submit">send code</button>
          </form>
        ) : (
          <form className="otp-box" onSubmit={onOtpSubmit}>
            <input
              className="otp-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="••••••"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
            />
            <div style={{ height: 8 }} />
            <button className="btn" type="submit">verify</button>
          </form>
        )}

        <div style={{ height: 16 }} />
        <div className="hero-search-wrap" style={{ width: "min(520px, 90%)", textAlign: "center" }}>
          <p style={{ margin: "8px 0", color: "#cbd5e1" }}>or sign in with a password</p>
          <form className="search-box" onSubmit={async (e) => {
            e.preventDefault();
            setStatus("signing in...");
            if (!isStanfordEmail(pwEmail)) {
              setStatus("hold your horses");
              return;
            }
            const { error } = await supabase.auth.signInWithPassword({ email: pwEmail, password });
            if (error) {
              setStatus(error.message);
              return;
            }
            setStatus(null);
            window.location.href = "/";
          }}>
            <input
              className="search-input"
              type="email"
              placeholder="Email"
              value={pwEmail}
              onChange={(e) => setPwEmail(e.target.value)}
              pattern="^[^@\s]+@([^.]+\.)?stanford\.edu$"
              title="Use your @stanford.edu email"
              required
            />
            <div style={{ height: 6 }} />
            <input
              className="search-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div style={{ height: 8 }} />
            <button className="btn" type="submit">sign in</button>
          </form>
        </div>

        {status && <p style={{ color: "#cbd5e1" }}>{status}</p>}
      </div>
    </div>
  );
}


