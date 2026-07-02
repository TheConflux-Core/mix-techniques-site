import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserTier } from "@/lib/subscription";
import { MAX_TRACKS_PER_USER, MAX_TRACK_BYTES, ALLOWED_AUDIO_EXTS, ALLOWED_AUDIO_MIME } from "@/lib/billing";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: tracks, error } = await supabase
    .from("portfolio_tracks")
    .select("*")
    .eq("user_id", user.id)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    tracks: tracks || [],
    limit: MAX_TRACKS_PER_USER,
    remaining: Math.max(0, MAX_TRACKS_PER_USER - (tracks?.length ?? 0)),
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Tier gate: Pro only (single paid tier — see src/lib/billing.ts)
  const tier = await getUserTier(supabase, user.id);
  if (tier !== "pro") {
    return NextResponse.json(
      { error: "Pro subscription required to upload tracks. Visit /pricing." },
      { status: 403 }
    );
  }

  // Track count gate: enforced here AND by DB trigger (migration 012).
  // We check here first so we can return a friendlier error than a Postgres
  // exception that surfaces as a 500.
  const { count: currentCount, error: countError } = await supabase
    .from("portfolio_tracks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  if ((currentCount ?? 0) >= MAX_TRACKS_PER_USER) {
    return NextResponse.json(
      {
        error: `You've reached your portfolio limit of ${MAX_TRACKS_PER_USER} tracks. Delete one to upload another.`,
        code: "track_limit_reached",
        limit: MAX_TRACKS_PER_USER,
      },
      { status: 400 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const genre = formData.get("genre") as string | null;
  const role = formData.get("role") as string;
  const isPublic = formData.get("is_public") === "true";
  const peaksRaw = formData.get("waveform_peaks") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate file type (constants from src/lib/billing.ts)
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (
    !ALLOWED_AUDIO_MIME.includes(file.type as any) &&
    !(ext && (ALLOWED_AUDIO_EXTS as readonly string[]).includes(ext))
  ) {
    return NextResponse.json(
      { error: `Invalid file type. Allowed: ${ALLOWED_AUDIO_EXTS.join(", ").toUpperCase()}` },
      { status: 400 }
    );
  }

  // Validate file size
  if (file.size > MAX_TRACK_BYTES) {
    return NextResponse.json(
      { error: `File too large. Max: ${Math.round(MAX_TRACK_BYTES / 1024 / 1024)}MB` },
      { status: 400 }
    );
  }

  // Upload to Supabase Storage
  const filePath = `portfolio-tracks/${user.id}/${Date.now()}-${file.name}`;
  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from("portfolio-tracks")
    .upload(filePath, arrayBuffer, {
      contentType: file.type || `audio/${ext}`,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from("portfolio-tracks")
    .getPublicUrl(filePath);

  // Parse peaks
  let peaks: number[] | null = null;
  if (peaksRaw) {
    try {
      peaks = JSON.parse(peaksRaw);
    } catch {}
  }

  // Get max sort_order — race-safe: if a parallel insert wins, our nextOrder
  // collides and Postgres rejects on UNIQUE. Acceptable: the user re-tries.
  const { data: existingTracks } = await supabase
    .from("portfolio_tracks")
    .select("sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (existingTracks?.[0]?.sort_order ?? -1) + 1;

  // Insert track record. The DB trigger (migration 012) will also enforce the
  // tier + count limit as a backstop in case this check is bypassed.
  const { data: track, error: insertError } = await supabase
    .from("portfolio_tracks")
    .insert({
      user_id: user.id,
      title: title || file.name.replace(/\.[^/.]+$/, ""),
      description: description || null,
      genre: genre || null,
      role: role || "mixed",
      audio_url: urlData.publicUrl,
      waveform_peaks: peaks,
      duration_seconds: null, // Could be computed client-side
      file_format: ext || null,
      file_size_bytes: file.size,
      is_public: isPublic,
      sort_order: nextOrder,
    })
    .select()
    .single();

  if (insertError) {
    // The DB trigger raises with these error messages — translate to friendly 400
    if (
      insertError.message?.includes("portfolio_track_limit_reached") ||
      insertError.message?.includes("portfolio_tracks_forbidden")
    ) {
      return NextResponse.json(
        {
          error: insertError.message.replace(/^[a-z_]+:\s*/, ""),
          code: "track_limit",
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    track,
    limit: MAX_TRACKS_PER_USER,
    remaining: Math.max(0, MAX_TRACKS_PER_USER - ((currentCount ?? 0) + 1)),
  });
}