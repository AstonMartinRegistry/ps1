import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { getDeepinfraEmbedding } from "@/lib/embeddings/deepinfra";

export async function POST(request: Request) {
  try {
    const { query, limit } = await request.json();
    const q = (query ?? "").toString().trim();
    const k = Math.max(1, Math.min(20, Number(limit) || 10));
    if (!q) return NextResponse.json({ error: "query required" }, { status: 400 });

    const embedding = await getDeepinfraEmbedding(q);
    const supabase = await getServerSupabase();

    const { data, error } = await supabase.rpc("rank_profiles", {
      p_query_embedding: embedding,
      p_limit: k,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    type Ranked = { user_id: string; name: string; top_chunk: { content: string; content_text: string; similarity: number }; score: number };
    const results = (data || []) as Ranked[];

    // Notify matched users (one row per recipient). RLS should allow insert when triggered_by_user_id = auth.uid().
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user && results.length) {
      const notifications = results.map((r) => ({
        recipient_user_id: r.user_id,
        triggered_by_user_id: user.id,
        query: q,
      }));
      // Best-effort; ignore errors so search still returns
      await supabase.from("notifications").insert(notifications);
      // notify client UIs to refresh
      // Best-effort client refresh hint (ignored in production unless handled)
      try { (globalThis as unknown as Window).dispatchEvent?.(new Event("notifications:refresh")); } catch {}
    }

    return NextResponse.json({ results });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


