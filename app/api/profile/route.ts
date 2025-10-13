import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { getDeepinfraEmbedding } from "@/lib/embeddings/deepinfra";

export async function GET() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("profiles")
    .select("name, year, major, picture_url, hobbies, dreams")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(
    data || { name: "", year: "", major: "", picture_url: "", hobbies: "", dreams: "" }
  );
}

export async function POST(request: Request) {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const name = (body?.name ?? "").toString();
  const year = (body?.year ?? "").toString();
  const major = (body?.major ?? "").toString();
  const picture_url = (body?.picture_url ?? "").toString();
  const hobbies = (body?.hobbies ?? "").toString();
  const dreams = (body?.dreams ?? "").toString();

  // Upsert profile rows
  const { data: existing } = await supabase
    .from("profiles")
    .select("name, year, major, picture_url, hobbies, dreams")
    .eq("user_id", user.id)
    .maybeSingle();

  const { error: upsertErr } = await supabase
    .from("profiles")
    .upsert({ user_id: user.id, name, year, major, picture_url, hobbies, dreams })
    .eq("user_id", user.id);
  if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 400 });

  // Only re-embed changed fields
  const tasks: Promise<any>[] = [];
  if (!existing || existing.hobbies !== hobbies) {
    tasks.push(embedAndSave(supabase, user.id, "hobbies", hobbies));
  }
  if (!existing || existing.dreams !== dreams) {
    tasks.push(embedAndSave(supabase, user.id, "dreams", dreams));
  }
  await Promise.all(tasks);

  return NextResponse.json({ ok: true });
}

async function embedAndSave(supabase: any, userId: string, field: string, text: string) {
  if (!text || text.trim().length === 0) return;
  const embedding = await getDeepinfraEmbedding(text);
  // store or update in user_vectors keyed by (user_id, field)
  const { data: existing } = await supabase
    .from("user_vectors")
    .select("id")
    .eq("user_id", userId)
    .eq("content", field)
    .maybeSingle();
  if (existing) {
    await supabase.from("user_vectors").update({ embedding, content_text: text }).eq("id", existing.id);
  } else {
    await supabase.from("user_vectors").insert({ user_id: userId, content: field, content_text: text, embedding });
  }
}


