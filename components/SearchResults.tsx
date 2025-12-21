"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type RankedResult = {
  user_id: string;
  name: string;
  top_chunk: { content: string; content_text: string; similarity: number };
  score: number; // weighted
};

type Props = {
  onResultsChange: (hasResults: boolean) => void;
};

export default function SearchResults({ onResultsChange }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RankedResult[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    onResultsChange(hasSearched);
  }, [hasSearched, onResultsChange]);

  const handleAutoResize = useCallback((ta: HTMLTextAreaElement | null) => {
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        formRef.current?.requestSubmit?.();
      }
    },
    []
  );

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setStatus("searching...");
    setHasSearched(true);
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
    setQuery("");
  }

  const renderSearchForm = (wrapperClass: string) => (
    <div className={wrapperClass}>
      <form ref={formRef} onSubmit={onSearch} className="chatgpt-search-form">
        <textarea
          ref={textAreaRef}
          className="chatgpt-search-input"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            handleAutoResize(e.target);
          }}
          placeholder="describe who you're looking for..."
          rows={1}
          onInput={(e) => handleAutoResize(e.currentTarget)}
          onKeyDown={handleKeyDown}
        />
        <button className="chatgpt-search-btn" type="submit" disabled={!query.trim()}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </button>
      </form>
    </div>
  );

  return (
    <div className="search-container">
      {!hasSearched && (
        <div className="search-center-group">
          <h2 className="chatgpt-search-title">search for anyone</h2>
          
          {renderSearchForm("chatgpt-search-wrapper")}
        </div>
      )}
      
      {status && !hasSearched && <p className="chatgpt-search-status">{status}</p>}

      {hasSearched && (
        <div className="search-results-content">
          {results.length > 0 ? (
            <div className="search-results-grid">
              {results.map((r) => (
          <div key={r.user_id} className="modal search-result-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 300 }}>{r.name || "profile"}</div>
              <div style={{ fontSize: 12, opacity: 0.6, fontWeight: 300 }}>score {r.score.toFixed(3)}</div>
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, opacity: 0.6, fontWeight: 300 }}>{r.top_chunk.content.replace(/_/g, " ")}</div>
              <div style={{ marginTop: 4, fontWeight: 300, fontSize: 13 }}>{r.top_chunk.content_text}</div>
              <div style={{ marginTop: 6, fontSize: 12, opacity: 0.6, fontWeight: 300 }}>similarity {r.top_chunk.similarity.toFixed(3)}</div>
            </div>
            <div style={{ marginTop: 10 }}>
              <button className="btn" type="button" aria-label={`chat with ${r.name || "profile"}`}
                onClick={async () => {
                  try {
                    const res = await fetch("/api/dms/ensure", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ other_user_id: r.user_id }),
                    });
                    const json = await res.json();
                    if (!res.ok) throw new Error(json?.error || "failed to start chat");
                    const url = new URL(window.location.href);
                    url.hash = "dms";
                    url.searchParams.set("dm", json.conversation_id);
                    window.location.href = url.toString();
                  } catch (e) {
                    alert(e instanceof Error ? e.message : "failed to start chat");
                  }
                }}
              >
                chat
              </button>
            </div>
          </div>
        ))}
            </div>
          ) : (
            <div style={{ fontWeight: 300, fontSize: 14, color: "#666666", marginTop: 20 }}>
              {status || "no results found"}
            </div>
          )}
        </div>
      )}
      
      {hasSearched && renderSearchForm("search-bottom-bar")}
    </div>
  );
}


