"use client";

import { useEffect, useRef, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";

type Message = { id: string; text: string; me?: boolean };

export default function DmsThread() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);
  const supabase = getBrowserSupabase();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    function syncFromUrl() {
      const url = new URL(window.location.href);
      const dm = url.searchParams.get("dm");
      setConversationId(dm);
    }
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    window.addEventListener("dms:changed", syncFromUrl as EventListener);
    return () => {
      window.removeEventListener("popstate", syncFromUrl);
      window.removeEventListener("dms:changed", syncFromUrl as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!conversationId) { setMessages([]); return; }
    (async () => {
      try {
        const res = await fetch(`/api/dms/messages?conversation_id=${encodeURIComponent(conversationId)}`, { cache: "no-store" });
        const json = await res.json();
        if (res.ok) setMessages(json.items || []);
      } catch {}
    })();
  }, [conversationId]);

  // Realtime inserts for current conversation
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`dm:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const row = payload.new as { id: string; body: string };
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, { id: row.id, text: row.body }]));
          try { window.dispatchEvent(new Event("dms:list:refresh")); } catch {}
        }
      )
      .subscribe();
    return () => { try { supabase.removeChannel(channel); } catch {} };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    if (!conversationId) return;
    (async () => {
      try {
        const res = await fetch("/api/dms/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversation_id: conversationId, text }),
        });
        const json = await res.json();
        if (res.ok) {
          setMessages((prev) => [...prev, { id: json.id || `${Date.now()}`, text, me: true }]);
          setDraft("");
        }
      } catch {}
    })();
  }

  return (
    <div className="dms-thread">
      <div className="dms-thread-header">direct message</div>
      <div className="dms-thread-scroll">
        {messages.map((m) => (
          <div key={m.id} className={`dms-msg${m.me ? " me" : ""}`}>{m.text}</div>
        ))}
        <div ref={endRef} />
      </div>
      <form className="dms-composer" onSubmit={onSubmit}>
        <input
          className="search-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message..."
        />
        <button className="btn" type="submit">send</button>
      </form>
    </div>
  );
}


