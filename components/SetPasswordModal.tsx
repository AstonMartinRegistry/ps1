"use client";

import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";

export default function SetPasswordModal() {
  const supabase = getBrowserSupabase();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<string | null>(null);

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
    await supabase.auth.updateUser({ data: { password_set: true } });
    window.location.reload();
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2 className="modal-title">set your password</h2>
        <form onSubmit={onSubmit}>
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
          <div style={{ height: 10 }} />
          <button className="btn" type="submit">save password</button>
        </form>
        {status && <p style={{ color: "#cbd5e1", marginTop: 8 }}>{status}</p>}
      </div>
    </div>
  );
}


