import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

type NotificationRow = {
  id: number;
  recipient_user_id: string;
  triggered_by_user_id: string;
  query: string;
  created_at: string;
};

type ProfileRow = { notifications_read_at: string | null; unread_notifications_count?: number | null };

enum CountType { exact = 'exact' }

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
    .limit(100) as { data: NotificationRow[] | null; error: { message: string } | null };
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // unread_count from denormalized column maintained by trigger
  const { data: prof } = await supabase
    .from("profiles")
    .select("unread_notifications_count")
    .eq("user_id", user.id)
    .maybeSingle<ProfileRow>();

  let unreadCount = prof?.unread_notifications_count ?? null;

  // Fallback: if the denormalized column is missing/not set, compute from notifications
  if (unreadCount == null || unreadCount === 0) {
    // Try to derive using notifications_read_at if present; otherwise count all
    const { data: p2 } = await supabase
      .from("profiles")
      .select("notifications_read_at")
      .eq("user_id", user.id)
      .maybeSingle<ProfileRow>();

    const readAt = p2?.notifications_read_at ?? null;
    if (readAt) {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact" as CountType, head: true })
        .eq("recipient_user_id", user.id)
        .gt("created_at", readAt);
      unreadCount = count ?? 0;
    } else {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact" as CountType, head: true })
        .eq("recipient_user_id", user.id);
      unreadCount = count ?? 0;
    }
  }

  return NextResponse.json({ items: data ?? [], unread_count: unreadCount ?? 0 });
}


