"use client";

import { useEffect, useRef, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";

type Message = { id: string; text: string; me?: boolean; created_at?: string };

export default function DmsThread() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [otherUserName, setOtherUserName] = useState<string>("");
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
    if (!conversationId) { 
      setMessages([]); 
      setOtherUserName("");
      return; 
    }
    (async () => {
      try {
        // Fetch messages
        const res = await fetch(`/api/dms/messages?conversation_id=${encodeURIComponent(conversationId)}`, { cache: "no-store" });
        const json = await res.json();
        if (res.ok) setMessages(json.items || []);
        
        // Fetch conversation details for the other user's name
        const convRes = await fetch("/api/dms/conversations", { cache: "no-store" });
        const convJson = await convRes.json();
        const conv = convJson.items?.find((c: { conversation_id: string }) => c.conversation_id === conversationId);
        if (conv?.name) setOtherUserName(conv.name);
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
          const row = payload.new as { id: string; body: string; created_at: string };
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, { id: row.id, text: row.body, created_at: row.created_at }]));
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
          setMessages((prev) => [...prev, { id: json.id || `${Date.now()}`, text, me: true, created_at: new Date().toISOString() }]);
          setDraft("");
        }
      } catch {}
    })();
  }

  if (!conversationId) {
    return (
      <div className="dms-thread">
        <div className="dms-thread-empty">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <h3>your messages</h3>
          <p>select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dms-thread">
      <div className="dms-thread-header">
        <div className="dms-thread-info">
          <h3>conversation</h3>
        </div>
      </div>
      <div className="dms-thread-scroll">
        {messages.length === 0 ? (
          <div className="dms-thread-start">
            <div className="dms-thread-start-avatar">
              {otherUserName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
            </div>
            <h4>{otherUserName || "user"}</h4>
            <p>start your conversation</p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`dms-msg-wrapper ${m.me ? "me" : "them"}`}>
              <div className="dms-msg">{m.text}</div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
      <form className="dms-composer" onSubmit={onSubmit}>
        <div className="dms-composer-inner">
          <input
            className="dms-composer-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="message..."
            autoComplete="off"
          />
          <button 
            className="dms-composer-send" 
            type="submit"
            disabled={!draft.trim()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}


