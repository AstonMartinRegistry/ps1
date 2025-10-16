"use client";

import { useState, useEffect, useRef } from "react";

type Props = {
  email?: string | null;
};

export default function UserBadge({ email }: Props) {
  const [open, setOpen] = useState(false);
  const popRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // no notifications polling here; badge is for account only

  async function onSignOut() {
    try {
      await fetch("/auth/signout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <div className="user-badge" ref={popRef}>
      <button className="user-chip" onClick={() => setOpen((v) => !v)}>
        {email ?? "account"}
      </button>
      {open && (
        <div className="user-popover">
          <button className="btn" onClick={onSignOut}>sign out</button>
        </div>
      )}
    </div>
  );
}


