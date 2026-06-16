import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, location, genre, track_title, social_links, track_url, waveform_data, file_format, duration } = body;

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
      return NextResponse.json({ error: "Track file not found in storage" }, { status: 400 });
    }

    // Get active season
    const { data: season } = await supabase
      .from("seasons")
      .select("id")
      .eq("status", "active")
      .single();

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
    };

    // Only add user_id if the column exists (optional — uncomment after adding column)
    // if (session?.user?.id) insertData.user_id = session.user.id;

    const { data: submission, error: insertError } = await supabase
      .from("submissions")
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", JSON.stringify(insertError, null, 2));
      return NextResponse.json(
        { error: "Failed to save submission" },
        { status: 500 }
      );
    }

    return NextResponse.json(submission, { status: 201 });
  } catch (err: any) {
    console.error("Submission error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
