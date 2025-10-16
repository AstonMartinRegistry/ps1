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
    return NextResponse.json({ results: data || [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


