import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

type NotificationRow = {
  id: number;
  recipient_user_id: string;
  triggered_by_user_id: string;
  query: string;
  created_at: string;
};

export async function GET() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("notifications")
    .select("id, recipient_user_id, triggered_by_user_id, query, created_at")
    .eq("recipient_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5) as { data: NotificationRow[] | null; error: any };
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ items: data ?? [] });
}


