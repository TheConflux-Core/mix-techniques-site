import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Validate session with Supabase Auth (refreshes stale JWT)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, location, genre, track_title, social_links, track_url, waveform_data, file_format, duration, episode_id } = body;

    // Server-side validation
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!genre) {
      return NextResponse.json({ error: "Genre is required" }, { status: 400 });
    }
    if (!track_title?.trim()) {
      return NextResponse.json({ error: "Track title is required" }, { status: 400 });
    }
    if (!track_url?.trim()) {
      return NextResponse.json({ error: "Track file is required (upload first, then submit)" }, { status: 400 });
    }

    // Verify the file exists in storage
    const { error: storageCheck } = await supabase.storage
      .from("submissions")
      .createSignedUrl(track_url, 60);

    if (storageCheck) {
      console.error("Storage check failed:", JSON.stringify(storageCheck, null, 2));
      return NextResponse.json({ error: "Track file not found in storage" }, { status: 400 });
    }

    // If episode_id provided, verify episode is accepting submissions
    if (episode_id) {
      const { data: episode } = await supabase
        .from("episodes")
        .select("id, status, episode_number, submissions_open")
        .eq("id", episode_id)
        .single();

      if (!episode) {
        return NextResponse.json({ error: "Episode not found" }, { status: 400 });
      }
      if (!episode.submissions_open) {
        return NextResponse.json({ error: "Submissions are closed for this episode" }, { status: 400 });
      }

      // Check for duplicate submission (same email + episode)
      const { data: existing } = await supabase
        .from("submissions")
        .select("id")
        .eq("email", email.trim())
        .eq("episode_id", episode_id)
        .limit(1)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: "You have already submitted to this episode. One submission per artist per episode." },
          { status: 409 }
        );
      }
    }

    // Get active season (may not exist yet)
    let season = null;
    try {
      const { data } = await supabase
        .from("seasons")
        .select("id")
        .eq("status", "active")
        .single();
      season = data;
    } catch (seasonErr) {
      console.error("Season lookup error (non-fatal):", seasonErr);
    }

    // Insert submission record
    const insertData: Record<string, any> = {
      name: name.trim(),
      email: email.trim(),
      location: location?.trim() || null,
      genre,
      social_links: social_links || {},
      track_url,
      track_title: track_title?.trim() || null,
      track_duration: duration ? String(duration) : null,
      waveform_data: waveform_data || null,
      file_format: file_format || null,
      season_id: season?.id || null,
      episode_id: episode_id || null,
    };

    // Use admin client for insert (bypasses RLS)
    const admin = createAdminClient();
    if (user?.id) insertData.user_id = user.id;

    const { data: submission, error: insertError } = await admin
      .from("submissions")
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", JSON.stringify(insertError, null, 2));
      console.error("Insert data was:", JSON.stringify(insertData, null, 2));
      return NextResponse.json(
        { error: `Failed to save submission: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(submission, { status: 201 });
  } catch (err: any) {
    console.error("Submission error:", err?.message || err);
    console.error("Full error:", JSON.stringify(err, null, 2));
    return NextResponse.json(
      { error: `Internal server error: ${err?.message || "unknown"}` },
      { status: 500 }
    );
  }
}
