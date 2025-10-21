"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";

type Notif = { id: number; query: string; created_at: string };

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`request failed: ${res.status}`);
  return res.json();
}

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0); // unread badge from server
  const [items, setItems] = useState<Notif[]>([]);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const isOpenRef = useRef(false);
  const supabase = getBrowserSupabase();

  const refreshUnread = useCallback(async () => {
    try {
      // cache-bust to ensure fresh value
      const json = await fetchJSON<{ items: Notif[]; unread_count: number }>(`/api/notifications?_=${Date.now()}`);
      setCount(json.unread_count || 0);
    } catch {}
  }, []);

  // Initial badge from server
  useEffect(() => {
    refreshUnread();
  }, [refreshUnread]);

  // Subscribe once to realtime inserts; use a ref to know if dropdown is open
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (!uid) return;
      const channel = supabase
        .channel(`notifications:${uid}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_user_id=eq.${uid}` },
          async (payload) => {
            const row = payload.new as Notif;
            if (isOpenRef.current) {
              // While open: append to list AND show a small badge increment, per spec
              setItems((prev) => (prev.some((n) => n.id === row.id) ? prev : [{ id: row.id, query: row.query, created_at: row.created_at }, ...prev]));
              setCount((c) => c + 1);
            } else {
              // Not viewing: bump badge only
              setCount((c) => c + 1);
            }
          }
        )
        .subscribe();
      return () => { try { supabase.removeChannel(channel); } catch {} };
    })();
    // subscribe once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!open) return;
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => { document.removeEventListener("mousedown", onDoc); };
  }, [open]);

  // Refresh unread count when page becomes visible/focused or when app dispatches a refresh event
  useEffect(() => {
    function onVis() {
      if (document.visibilityState === "visible") refreshUnread();
    }
    function onFocus() { refreshUnread(); }
    function onRefresh() { refreshUnread(); }
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);
    window.addEventListener("notifications:refresh", onRefresh as EventListener);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("notifications:refresh", onRefresh as EventListener);
    };
  }, [refreshUnread]);

  async function toggleOpen() {
    const willOpen = !open;
    setOpen(willOpen);
    isOpenRef.current = willOpen;
    if (willOpen) {
      try {
        // Mark all as read on server, then fetch latest list to display
        await fetch("/api/notifications/read", { method: "POST" });
        const json = await fetchJSON<{ items: Notif[]; unread_count: number }>("/api/notifications");
        setItems(json.items || []);
      } catch {}
      // Clear badge locally
      setCount(0);
    } else {
      // On close, clear badge; new inserts after close will bump it again
      setCount(0);
    }
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
        <div style={{ position: "absolute", top: 44, right: 0, width: 320, maxHeight: 260, overflowY: "auto" }} className="user-popover">
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


