import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { getDeepinfraEmbedding } from "@/lib/embeddings/deepinfra";

export async function GET() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("user_vectors")
    .select("id, content, content_text")
    .eq("user_id", user.id)
    .order("id", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ items: data || [] });
}

type Item = { content: string; content_text: string };

export async function POST(request: Request) {
  try {
    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const items: Item[] = Array.isArray(body?.items) ? body.items : [];
    if (!items.length) return NextResponse.json({ ok: true });

    // Enforce max 15 per user
    const { data: existingAll, error: countErr } = await supabase
      .from("user_vectors")
      .select("id, content, content_text")
      .eq("user_id", user.id);
    if (countErr) return NextResponse.json({ error: countErr.message }, { status: 400 });
    const existingMap = new Map<string, string>();
    for (const r of existingAll || []) existingMap.set(r.content, r.content_text ?? "");

    const incomingKeys = new Set(items.map(i => i.content));
    const totalAfter = new Set<string>([...existingMap.keys(), ...incomingKeys]).size;
    if (totalAfter > 15) {
      return NextResponse.json({ error: "max 15 vectors per profile" }, { status: 400 });
    }

    // Upsert only changed items; embed on change
    for (const it of items) {
      const key = (it.content || "").trim();
      const text = (it.content_text || "").toString();
      if (!key || !text) continue;
      const prev = existingMap.get(key);
      if (prev === text) continue; // skip unchanged
      const embedding = await getDeepinfraEmbedding(text);

      // try update first
      const { data: found } = await supabase
        .from("user_vectors")
        .select("id")
        .eq("user_id", user.id)
        .eq("content", key)
        .maybeSingle();
      if (found) {
        await supabase
          .from("user_vectors")
          .update({ content_text: text, embedding })
          .eq("id", found.id);
      } else {
        await supabase
          .from("user_vectors")
          .insert({ user_id: user.id, content: key, content_text: text, embedding });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    let content = "";
    let id: number | null = null;
    try {
      const body = await request.json();
      content = (body?.content ?? "").toString();
      if (body?.id != null) {
        const n = Number(body.id);
        if (!Number.isNaN(n)) id = n;
      }
    } catch {}
    if (!content) {
      const { searchParams } = new URL(request.url);
      content = (searchParams.get("content") ?? "").toString();
      const idParam = searchParams.get("id");
      if (idParam != null) {
        const n = Number(idParam);
        if (!Number.isNaN(n)) id = n;
      }
    }
    if (id == null && !content) return NextResponse.json({ error: "id or content required" }, { status: 400 });

    let q = supabase.from("user_vectors").delete().eq("user_id", user.id);
    if (id != null) q = q.eq("id", id);
    else q = q.eq("content", content);
    const { error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "error" }, { status: 500 });
  }
}


