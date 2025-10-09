"use client";

import { getBrowserSupabase } from "@/lib/supabase/browser";
import { useState } from "react";

export default function LoginPage() {
  const supabase = getBrowserSupabase();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending...");
    const redirectOrigin = window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${redirectOrigin}/auth/callback`,
      },
    });
    if (error) {
      setStatus(error.message);
    } else {
      setStatus("Check your email for a login link.");
    }
  }

  return (
    <div className="hero">
      <div className="hero-group">
        <h1 className="hero-title">welcome to the registry</h1>
        <p style={{ maxWidth: 640, textAlign: "center", color: "#cbd5e1", margin: 0 }}>
          find anyone in 5 seconds. search across public signals with precision.
        </p>
        <form className="search-box" onSubmit={onSubmit}>
          <input
            className="search-input"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div style={{ height: 8 }} />
          <button className="btn" type="submit">send magic link</button>
        </form>
        {status && <p style={{ color: "#cbd5e1" }}>{status}</p>}
      </div>
    </div>
  );
}


