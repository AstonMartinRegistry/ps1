"use client";

import { getBrowserSupabase } from "@/lib/supabase/browser";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const supabase = getBrowserSupabase();
  const [step, setStep] = useState<"password" | "email" | "otp">("password");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pwEmail, setPwEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  // Domain restriction disabled for testing

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
    // domain restriction temporarily disabled
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
    <div className="minimal-layout">
      <header className="minimal-header">
        <h1 className="minimal-logo">
          <span className="blue-square"></span>
          theregistry
        </h1>
      </header>

      <div className="minimal-content">
        <aside className="minimal-box">
          <h2 className="minimal-box-title">login</h2>
          {step === "password" ? (
            <>
              <form className="minimal-form" onSubmit={async (e) => {
                e.preventDefault();
                if (!pwEmail || !password) {
                  setStatus("please enter email and password");
                  return;
                }
                setStatus("signing in...");
                const { error } = await supabase.auth.signInWithPassword({ email: pwEmail, password });
                if (error) {
                  setStatus(error.message);
                  return;
                }
                setStatus(null);
                window.location.href = "/";
              }}>
                <input
                  className="minimal-input"
                  type="email"
                  placeholder="email"
                  value={pwEmail}
                  onChange={(e) => setPwEmail(e.target.value)}
                  required
                  autoFocus
                />
                <input
                  className="minimal-input"
                  type="password"
                  placeholder="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button className="minimal-button" type="submit">login</button>
              </form>
            </>
          ) : step === "email" ? (
            <form className="minimal-form" onSubmit={onEmailSubmit}>
              <input
                className="minimal-input"
                type="email"
                placeholder="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
              <button className="minimal-button" type="submit">send code</button>
            </form>
          ) : step === "otp" ? (
            <form className="minimal-form" onSubmit={onOtpSubmit}>
              <input
                className="minimal-input"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                required
                autoFocus
              />
              <button className="minimal-button" type="submit">verify</button>
            </form>
          ) : null}

          {status && <p className="minimal-status">{status}</p>}
        </aside>

        <main className="minimal-box">
          <h2 className="minimal-box-title">[ welcome to Theregistry ]</h2>
          <p className="minimal-text">
            Theregistry is an online directory that connects people through artificial intelligence. The registry is only open to stanford students.
          </p>
          <p className="minimal-text">
            You can use the registry to:
          </p>
          <ul className="minimal-list">
            <li>search for people with natural language</li>
            <li>message the people you find</li>
            <li>optimize your searchability</li>
          </ul>
          <p className="minimal-text">
            To get started, enter your email. If you already created an account you can login.
          </p>
          
          {step === "password" && (
            <>
              <h2 className="minimal-box-title">register</h2>
              <form className="minimal-form" onSubmit={onEmailSubmit}>
                <input
                  className="minimal-input"
                  type="email"
                  placeholder="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button className="minimal-button" type="submit">send code</button>
              </form>
            </>
          )}
        </main>
      </div>

      <footer className="minimal-footer">
        <p className="minimal-footer-text">born dec 25</p>
      </footer>
    </div>
  );
}


