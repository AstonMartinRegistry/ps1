import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

type TopRow = { user_id: string; name: string | null; image_url: string | null; search_count: number | null };

export async function GET() {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, name, image_url, search_count")
    .order("search_count", { ascending: false, nullsFirst: false })
    .limit(50) as { data: TopRow[] | null; error: { message: string } | null };
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ items: data ?? [] });
}


