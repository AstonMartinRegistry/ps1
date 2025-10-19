import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { getDeepinfraEmbedding } from "@/lib/embeddings/deepinfra";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profileRowInitial, error } = await supabase
    .from("profiles")
    .select("image_url, name, major, year, dorm")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Auto-create a blank profile row if missing so the account is searchable/joinable
  let profileRow = profileRowInitial;
  if (!profileRow) {
    const { error: insErr } = await supabase
      .from("profiles")
      .insert({ user_id: user.id, image_url: "", name: "", major: "", year: "", dorm: "" });
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 });
    profileRow = { image_url: "", name: "", major: "", year: "", dorm: "" };
  }

  type CoreRow = { content: string; content_text: string | null; is_core: boolean };
  const { data: coreRows } = await supabase
    .from("user_vectors")
    .select("content, content_text, is_core")
    .eq("user_id", user.id)
    .eq("is_core", true) as { data: CoreRow[] | null };

  const coreMap = new Map<string, string>();
  (coreRows || []).forEach((r) => coreMap.set(r.content, r.content_text ?? ""));

  return NextResponse.json({
    image_url: profileRow?.image_url ?? "",
    name: profileRow?.name ?? "",
    major: profileRow?.major ?? "",
    year: profileRow?.year ?? "",
    dorm: profileRow?.dorm ?? "",
    // Provide core text values for the UI
    hobbies: coreMap.get("some_of_my_hobies") ?? "",
    dreams: coreMap.get("what_i_want_to_do_when_i_grow_up") ?? "",
  });
}

export async function POST(request: Request) {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const image_url = (body?.image_url ?? "").toString();
  const name = (body?.name ?? "").toString();
  const major = (body?.major ?? "").toString();
  const year = (body?.year ?? "").toString();
  const dorm = (body?.dorm ?? "").toString();
  const hobbies = (body?.hobbies ?? "").toString();
  const dreams = (body?.dreams ?? "").toString();

  // Upsert profile rows (human-readable only)
  const { error: upsertErr } = await supabase
    .from("profiles")
    .upsert({ user_id: user.id, image_url, name, major, year, dorm })
    .eq("user_id", user.id);
  if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 400 });

  // Build structured profile text and upsert its vector if changed
  const structured = `Name: ${name}, Major: ${major}, Year: ${year}, Dorm: ${dorm}`.trim();
  await upsertVectorIfChanged(supabase, user.id, "structured_profile", structured, true);

  // Core texts: upsert vectors if changed
  await upsertVectorIfChanged(supabase, user.id, "some_of_my_hobies", hobbies, true);
  await upsertVectorIfChanged(supabase, user.id, "what_i_want_to_do_when_i_grow_up", dreams, true);

  return NextResponse.json({ ok: true });
}

async function upsertVectorIfChanged(
  supabase: SupabaseClient,
  userId: string,
  key: string,
  text: string,
  isCore: boolean
): Promise<void> {
  const value = (text || "").trim();
  type VectorRow = { id: number; content_text: string | null };
  const { data: existing } = await supabase
    .from("user_vectors")
    .select("id, content_text")
    .eq("user_id", userId)
    .eq("content", key)
    .maybeSingle<VectorRow>();
  if (existing && existing.content_text === value) return; // unchanged
  if (!value) return; // skip empty
  const embedding = await getDeepinfraEmbedding(value);
  if (existing) {
    await supabase
      .from("user_vectors")
      .update({ content_text: value, embedding, is_core: isCore })
      .eq("id", existing.id);
  } else {
    await supabase
      .from("user_vectors")
      .insert({ user_id: userId, content: key, content_text: value, embedding, is_core: isCore });
  }
}


