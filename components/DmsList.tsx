"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Item = { 
  conversation_id: string; 
  other_user_id: string | null; 
  name: string; 
  image_url: string;
  last_message?: string;
  last_message_at?: string;
};

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("request failed");
  return res.json();
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
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
      <div className="dms-list-header">
        <h2 className="dms-title">messages</h2>
      </div>
      <div className="dms-list-scroll">
        {items.length === 0 ? (
          <div className="dms-empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <p>no messages yet</p>
            <span>start a conversation from search</span>
          </div>
        ) : (
          items.map((it) => (
            <button 
              key={it.conversation_id} 
              className={`dms-list-item${active === it.conversation_id ? " dms-active" : ""}`} 
              onClick={() => onPick(it.conversation_id)}
            >
              <div className="dms-avatar">
                {it.image_url ? (
                  <Image src={it.image_url} alt={it.name} width={40} height={40} />
                ) : (
                  <span className="dms-avatar-text">{getInitials(it.name || "?")}</span>
                )}
              </div>
              <div className="dms-item-content">
                <div className="dms-item-top">
                  <span className="dms-item-name">{it.name || "unknown"}</span>
                </div>
                <div className="dms-item-preview">
                  {it.last_message || "no messages yet"}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}


