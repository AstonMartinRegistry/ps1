"use client";

import { useEffect, useState } from "react";

type Notif = { id: number; query: string; created_at: string };

export default function NotificationsList() {
  const [items, setItems] = useState<Notif[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch("/api/notifications");
        const json = await res.json();
        if (mounted) setItems((json.items || []) as Notif[]);
      } catch {}
    }
    load();
    const id = setInterval(load, 5000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  if (!items.length) return <div style={{ opacity: 0.8 }}>no notifications</div>;

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {items.map((n) => (
        <div key={n.id} className="modal" style={{ padding: 12 }}>
          <div>you appeared in a search for &quot;{n.query}&quot;</div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>{new Date(n.created_at).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}


