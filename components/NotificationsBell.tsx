"use client";

import { useEffect, useRef, useState } from "react";

type Notif = { id: number; query: string; created_at: string };

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<Notif[]>([]);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  async function load(fetchList: boolean) {
    const res = await fetch("/api/notifications", { cache: "no-store" });
    const json = await res.json();
    if (Array.isArray(json.items)) {
      setCount(json.items.length);
      if (fetchList) setItems(json.items as Notif[]);
    }
  }

  useEffect(() => {
    // initial count
    load(false).catch(() => {});
    function onDoc(e: MouseEvent) {
      if (!open) return;
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onRefresh() {
      // refresh list if open; always refresh count
      load(open).catch(() => {});
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("notifications:refresh", onRefresh as EventListener);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("notifications:refresh", onRefresh as EventListener);
    };
  }, [open]);

  async function toggleOpen() {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen) load(true).catch(() => {});
  }

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button className="bell-btn" aria-label="notifications" onClick={toggleOpen}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M12 3a6 6 0 00-6 6v2.586l-.707.707A1 1 0 006 14h12a1 1 0 00.707-1.707L18 11.586V9a6 6 0 00-6-6z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <path d="M9.5 18a2.5 2.5 0 005 0" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </svg>
        {count > 0 && (
          <span style={{ marginLeft: 8, background: "#f87171", color: "#0b1222", borderRadius: 999, padding: "0 6px", fontSize: 12 }}>{count}</span>
        )}
      </button>
      {open && (
        <div style={{ position: "absolute", top: 44, right: 0, width: 320 }} className="user-popover">
          <div style={{ fontWeight: 600, marginBottom: 8 }}>notifications</div>
          {items.length === 0 ? (
            <div style={{ opacity: 0.8 }}>no notifications</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {items.map((n) => (
                <div key={n.id} className="modal" style={{ padding: 10 }}>
                  <div>you appeared in a search for &quot;{n.query}&quot;</div>
                  <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>{new Date(n.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


