import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = (searchParams.get("conversation_id") || "").toString();
    if (!conversationId) return NextResponse.json({ error: "conversation_id required" }, { status: 400 });

    const supabase = await getServerSupabase();
    const { data: auth } = await supabase.auth.getUser();
    const me = auth.user?.id;
    if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    // RLS should ensure membership; we just fetch
    const { data, error } = await supabase
      .from("messages")
      .select("id, sender_user_id, body, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const items = (data || []).map((r: any) => ({
      id: r.id,
      text: r.body as string,
      me: r.sender_user_id === me,
      created_at: r.created_at,
    }));
    return NextResponse.json({ items });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const conversationId = (body?.conversation_id || "").toString();
    const text = (body?.text || "").toString();
    if (!conversationId || !text) return NextResponse.json({ error: "conversation_id and text required" }, { status: 400 });

    const supabase = await getServerSupabase();
    const { data: auth } = await supabase.auth.getUser();
    const me = auth.user?.id;
    if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_user_id: me, body: text })
      .select("id, created_at")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ id: data.id, created_at: data.created_at });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


