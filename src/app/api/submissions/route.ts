import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const metadataStr = formData.get("metadata") as string;

    if (!file || !metadataStr) {
      return NextResponse.json(
        { error: "Missing file or metadata" },
        { status: 400 }
      );
    }

    const metadata = JSON.parse(metadataStr);

    // Server-side validation
    if (!metadata.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!metadata.email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!metadata.genre) {
      return NextResponse.json({ error: "Genre is required" }, { status: 400 });
    }
    if (!metadata.track_title?.trim()) {
      return NextResponse.json({ error: "Track title is required" }, { status: 400 });
    }

    // Validate file type
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["wav", "mp3", "flac"].includes(ext)) {
      return NextResponse.json(
        { error: "Invalid file type. Only .wav, .mp3, .flac accepted." },
        { status: 400 }
      );
    }

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum 50MB." },
        { status: 400 }
      );
    }

    // Upload to Supabase Storage
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${timestamp}_${sanitizedName}`;

    const { error: uploadError } = await supabase.storage
      .from("submissions")
      .upload(storagePath, file, {
        contentType: file.type || `audio/${ext}`,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Get active season
    const { data: season } = await supabase
      .from("seasons")
      .select("id")
      .eq("status", "active")
      .single();

    // Insert submission record
    const { data: submission, error: insertError } = await supabase
      .from("submissions")
      .insert({
        name: metadata.name.trim(),
        email: metadata.email.trim(),
        location: metadata.location?.trim() || null,
        genre: metadata.genre,
        social_links: metadata.social_links || {},
        track_url: storagePath,
        track_title: metadata.track_title?.trim() || null,
        waveform_data: metadata.waveform_data || null,
        file_format: ext,
        season_id: season?.id || null,
      })
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
