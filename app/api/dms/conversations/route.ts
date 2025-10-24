import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

type MemberRow = { conversation_id: string; user_id: string };
type ProfileRow = { user_id: string; name: string | null; image_url: string | null };

export async function GET() {
  try {
    const supabase = await getServerSupabase();
    const { data: auth } = await supabase.auth.getUser();
    const me = auth.user?.id;
    if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    // All conversations I'm in
    const { data: mine, error: memErr } = await supabase
      .from("conversation_members")
      .select("conversation_id, user_id") as { data: MemberRow[] | null; error: any };
    if (memErr) return NextResponse.json({ error: memErr.message }, { status: 400 });
    const myRows = (mine || []).filter(r => r.user_id === me);
    const convIds = Array.from(new Set(myRows.map(r => r.conversation_id)));
    if (!convIds.length) return NextResponse.json({ items: [] });

    // Other members for those conversations (not me)
    const { data: othersAll, error: othersErr } = await supabase
      .from("conversation_members")
      .select("conversation_id, user_id")
      .in("conversation_id", convIds) as { data: MemberRow[] | null; error: any };
    if (othersErr) return NextResponse.json({ error: othersErr.message }, { status: 400 });
    const others = (othersAll || []).filter(r => r.user_id !== me);
    const otherUserIds = Array.from(new Set(others.map(r => r.user_id)));

    // Batch fetch profiles for display
    const { data: profs } = await supabase
      .from("profiles")
      .select("user_id, name, image_url")
      .in("user_id", otherUserIds) as { data: ProfileRow[] | null };
    const idToProfile = new Map<string, ProfileRow>();
    (profs || []).forEach(p => idToProfile.set(p.user_id, p));

    // Collapse to one other per conversation (DMs have 2 members)
    const byConv = new Map<string, string>();
    for (const r of others) { if (!byConv.has(r.conversation_id)) byConv.set(r.conversation_id, r.user_id); }

    const items = convIds.map(cid => {
      const otherId = byConv.get(cid) || null;
      const prof = otherId ? idToProfile.get(otherId) : undefined;
      return {
        conversation_id: cid,
        other_user_id: otherId,
        name: prof?.name ?? "",
        image_url: prof?.image_url ?? "",
      };
    });

    return NextResponse.json({ items });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


