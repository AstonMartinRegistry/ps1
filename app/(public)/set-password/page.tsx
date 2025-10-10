"use client";

import { getBrowserSupabase } from "@/lib/supabase/browser";
import { useEffect, useState } from "react";

export default function SetPasswordPage() {
  const supabase = getBrowserSupabase();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    // If not logged in, go to login
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = "/login";
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setStatus("password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setStatus("passwords do not match");
      return;
    }
    setStatus("saving...");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus(error.message);
      return;
    }
    // mark that user set a password so we can skip set-password later
    await supabase.auth.updateUser({ data: { password_set: true } });
    window.location.href = "/";
  }

  return (
    <div className="hero">
      <div className="hero-group">
        <h1 className="hero-title">set your password</h1>
        <form className="otp-box" onSubmit={onSubmit}>
          <input
            className="search-input"
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div style={{ height: 8 }} />
          <input
            className="search-input"
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          <div style={{ height: 8 }} />
          <button className="btn" type="submit">save password</button>
        </form>
        {status && <p style={{ color: "#cbd5e1" }}>{status}</p>}
      </div>
    </div>
  );
}


