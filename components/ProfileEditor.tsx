"use client";

import { useEffect, useState } from "react";

type ProfileData = { image_url: string; name: string; major: string; year: string; dorm: string; hobbies: string; dreams: string };

export default function ProfileEditor() {
  const [data, setData] = useState<ProfileData>({ image_url: "", name: "", major: "", year: "", dorm: "", hobbies: "", dreams: "" });
  const [original, setOriginal] = useState<ProfileData>({ image_url: "", name: "", major: "", year: "", dorm: "", hobbies: "", dreams: "" });
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  type VectorItem = { id?: number; content: string; content_text: string };
  const [extras, setExtras] = useState<VectorItem[]>([]);
  const [removedKeys, setRemovedKeys] = useState<string[]>([]);
  const EXTRA_CHOICES = [
    { key: "research_interests", label: "research interests" },
    { key: "clubs", label: "clubs" },
    { key: "projects", label: "projects" },
    { key: "publications", label: "publications" },
    { key: "skills", label: "skills" },
  ];
  // Map core fields to vector keys so they render consistently with extras but cannot be removed
  const CORE_MAP: Record<string, string> = {
    hobbies: "some_of_my_hobies",
    dreams: "what_i_want_to_do_when_i_grow_up",
  };
  const labelForKey = (k: string) => EXTRA_CHOICES.find(c => c.key === k)?.label || k.replace(/_/g, " ");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/profile", { cache: "no-store" });
        const json = await res.json();
        if (res.ok) {
          const init: ProfileData = {
            image_url: (json?.image_url ?? "").toString(),
            name: (json?.name ?? "").toString(),
            major: (json?.major ?? "").toString(),
            year: (json?.year ?? "").toString(),
            dorm: (json?.dorm ?? "").toString(),
            hobbies: (json?.hobbies ?? "").toString(),
            dreams: (json?.dreams ?? "").toString(),
          };
          setData(init);
          setOriginal(init);
        } else {
          setStatus(json?.error || "failed to load profile");
        }
        // load existing vector items for display/edit
        const vr = await fetch("/api/user-vectors", { cache: "no-store" });
        const vj = await vr.json();
        if (vr.ok) {
          const items = (Array.isArray(vj.items) ? vj.items : []) as VectorItem[];
          setExtras(items);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "failed to load profile";
        setStatus(msg);
      }
    })();
  }, []); // CORE_KEYS is constant

  async function onSave() {
    setStatus("saving...");
    const profileChanged =
      data.image_url !== original.image_url ||
      data.name !== original.name ||
      data.major !== original.major ||
      data.year !== original.year ||
      data.dorm !== original.dorm ||
      data.hobbies !== original.hobbies ||
      data.dreams !== original.dreams;

    // Save profile core fields if changed
    if (profileChanged) {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: data.image_url,
          name: data.name,
          major: data.major,
          year: data.year,
          dorm: data.dorm,
          hobbies: data.hobbies,
          dreams: data.dreams,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatus(json?.error || "error saving");
        return;
      }
      setOriginal({ ...data });
    }

    // Apply queued deletions
    if (removedKeys.length) {
      await Promise.all(
        removedKeys.map((key) => {
          const n = Number(key);
          if (!Number.isNaN(n)) {
            return fetch(`/api/user-vectors?id=${n}`, { method: "DELETE" });
          }
          return fetch(`/api/user-vectors?content=${encodeURIComponent(key)}`, { method: "DELETE" });
        })
      );
      setRemovedKeys([]);
    }

    // Always persist remaining extras (server skips unchanged and enforces max 15)
    await fetch("/api/user-vectors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: extras }),
    });

    setEditing(false);
    setStatus("saved");
  }

  return (
    <div>
      <h2 className="profile-title">welcome home</h2>
      <label className="field-label" htmlFor="image_url">picture url</label>
      <input id="image_url" className="search-input" value={data.image_url} onChange={(e) => setData((d) => ({ ...d, image_url: e.target.value }))} disabled={!editing} />
      <label className="field-label" htmlFor="name">name</label>
      <input id="name" className="search-input" value={data.name} onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))} disabled={!editing} />
      <label className="field-label" htmlFor="major">major</label>
      <input id="major" className="search-input" value={data.major} onChange={(e) => setData((d) => ({ ...d, major: e.target.value }))} disabled={!editing} />
      <label className="field-label" htmlFor="year">year</label>
      <input id="year" className="search-input" value={data.year} onChange={(e) => setData((d) => ({ ...d, year: e.target.value }))} disabled={!editing} />
      <label className="field-label" htmlFor="dorm">dorm</label>
      <input id="dorm" className="search-input" value={data.dorm} onChange={(e) => setData((d) => ({ ...d, dorm: e.target.value }))} disabled={!editing} />
      <label className="field-label" htmlFor="hobbies">some of my hobies</label>
      <textarea
        id="hobbies"
        className="text-area"
        rows={6}
        value={data.hobbies}
        onChange={(e) => setData((d) => ({ ...d, hobbies: e.target.value }))}
        disabled={!editing}
      />
      <label className="field-label" htmlFor="dreams">what I want to do when I grow up</label>
      <textarea
        id="dreams"
        className="text-area"
        rows={6}
        value={data.dreams}
        onChange={(e) => setData((d) => ({ ...d, dreams: e.target.value }))}
        disabled={!editing}
      />
      {extras.map((x, idx) => (
        <div key={x.content} style={{ marginTop: 8 }}>
          <label className="field-label">{labelForKey(x.content)}</label>
          <textarea
            className="text-area"
            rows={4}
            value={x.content_text}
            onChange={(e) => setExtras((arr) => arr.map((it, i) => i === idx ? { ...it, content_text: e.target.value } : it))}
            disabled={!editing}
          />
          {editing && !Object.values(CORE_MAP).includes(x.content) && (
            <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
              <button
                className="btn"
                type="button"
                onClick={() => {
                  setRemovedKeys((ks) => Array.from(new Set([...ks, x.id != null ? String(x.id) : x.content])));
                  setExtras((arr) => arr.filter((it) => it.content !== x.content));
                }}
              >
                remove
              </button>
            </div>
          )}
        </div>
      ))}

      {editing && (
        <div style={{ marginTop: 12 }}>
          <button
            className="btn"
            type="button"
            onClick={() => {
              const avail = EXTRA_CHOICES.filter(c => !extras.find(e => e.content === c.key));
              if (!avail.length) { alert("no more questions available"); return; }
              const pick = prompt("add a new question: " + avail.map(a => a.label).join(", "));
              const found = EXTRA_CHOICES.find(c => c.label === pick || c.key === pick);
              if (!found) return;
              setExtras((arr) => [...arr, { content: found.key, content_text: "" }]);
            }}
          >
            + add question
          </button>
        </div>
      )}

      <div style={{ height: 10 }} />
      {!editing ? (
        <button className="btn" onClick={() => setEditing(true)}>edit</button>
      ) : (
        <button className="btn" onClick={onSave}>save</button>
      )}
      {status && <p style={{ color: "#cbd5e1", marginTop: 8 }}>{status}</p>}
    </div>
  );
}


