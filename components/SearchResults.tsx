"use client";

import { useState } from "react";

type RankedResult = {
  user_id: string;
  name: string;
  top_chunk: { content: string; content_text: string; similarity: number };
  score: number; // weighted
};

export default function SearchResults() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RankedResult[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setStatus("searching...");
    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit: 1 }),
    });
    const json = await res.json();
    if (!res.ok) {
      setStatus(json.error || "error");
      setResults([]);
      return;
    }
    setStatus(null);
    setResults(json.results || []);
  }

  return (
    <div>
      <form onSubmit={onSearch} className="hero-search-wrap" style={{ width: "min(520px,90%)" }}>
        <input className="search-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="search profiles..." />
        <div style={{ height: 8 }} />
        <button className="btn" type="submit">search</button>
      </form>
      {status && <p style={{ color: "#cbd5e1", marginTop: 8 }}>{status}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 12, marginTop: 16 }}>
        {results.map((r) => (
          <div key={r.user_id} className="modal" style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 600 }}>{r.name || "profile"}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>score {r.score.toFixed(3)}</div>
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, opacity: 0.8 }}>{r.top_chunk.content.replace(/_/g, " ")}</div>
              <div style={{ marginTop: 4 }}>{r.top_chunk.content_text}</div>
              <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>similarity {r.top_chunk.similarity.toFixed(3)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


