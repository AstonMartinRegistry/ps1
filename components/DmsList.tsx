"use client";

import { useEffect, useState } from "react";

type Item = { conversation_id: string; other_user_id: string | null; name: string; image_url: string };

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("request failed");
  return res.json();
}

export default function DmsList() {
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    function load() {
      fetchJSON<{ items: Item[] }>("/api/dms/conversations").then((j) => setItems(j.items || [])).catch(() => {});
    }
    load();
    function onRefresh() { load(); }
    window.addEventListener("dms:list:refresh", onRefresh);
    return () => window.removeEventListener("dms:list:refresh", onRefresh);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const dm = url.searchParams.get("dm");
    if (dm) setActive(dm);
  }, []);

  function onPick(id: string) {
    setActive(id);
    const url = new URL(window.location.href);
    url.hash = "dms";
    url.searchParams.set("dm", id);
    window.history.replaceState({}, "", url.toString());
    window.dispatchEvent(new Event("dms:changed"));
  }

  return (
    <div className="dms-list">
      <div className="dms-list-header">direct messages</div>
      <div className="dms-list-scroll">
        {items.length === 0 ? (
          <div style={{ opacity: 0.8 }}>no conversations yet</div>
        ) : (
          items.map((it) => (
            <button key={it.conversation_id} className={`dms-list-item${active === it.conversation_id ? " dms-active" : ""}`} onClick={() => onPick(it.conversation_id)}>
              <div className="dms-avatar" aria-hidden />
              <div className="dms-item-text">
                <div className="dms-item-name">{it.name || "conversation"}</div>
                <div className="dms-item-sub">tap to view messages</div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}


