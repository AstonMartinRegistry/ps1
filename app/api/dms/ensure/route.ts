import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await getServerSupabase();
    const { data: auth } = await supabase.auth.getUser();
    const me = auth.user?.id;
    if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const other: string = (body?.other_user_id || "").toString();
    if (!other) return NextResponse.json({ error: "other_user_id required" }, { status: 400 });
    if (other === me) return NextResponse.json({ error: "cannot DM yourself" }, { status: 400 });

    // Use security definer RPC to comply with RLS
    const { data: rpcData, error: rpcErr } = await supabase.rpc("ensure_dm", { other_user_id: other });
    if (rpcErr) return NextResponse.json({ error: rpcErr.message }, { status: 400 });
    return NextResponse.json({ conversation_id: rpcData as string });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


