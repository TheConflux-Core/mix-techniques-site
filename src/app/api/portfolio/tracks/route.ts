import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  return NextResponse.json({ tracks: tracks || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check subscription tier
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("tier, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  const tier = subscription?.tier || "free";

  if (tier === "free") {
    return NextResponse.json(
      { error: "Pro or Studio subscription required" },
      { status: 403 }
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

  // Validate file type
  const allowedTypes = ["audio/wav", "audio/flac", "audio/mpeg", "audio/mp3", "audio/aiff", "audio/x-aiff"];
  const ext = file.name.split(".").pop()?.toLowerCase();
  const allowedExts = ["wav", "flac", "mp3", "aiff"];
  if (!allowedTypes.includes(file.type) && !allowedExts.includes(ext || "")) {
    return NextResponse.json({ error: "Invalid file type. Allowed: WAV, FLAC, MP3, AIFF" }, { status: 400 });
  }

  // Validate file size
  const maxSize = tier === "studio" ? 100 * 1024 * 1024 : 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: `File too large. Max: ${tier === "studio" ? "100MB" : "50MB"}` },
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

  // Get max sort_order
  const { data: existingTracks } = await supabase
    .from("portfolio_tracks")
    .select("sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (existingTracks?.[0]?.sort_order ?? -1) + 1;

  // Insert track record
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
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ track }, { status: 201 });
}
