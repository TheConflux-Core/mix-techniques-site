import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from("portfolio_tracks")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!existing || existing.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.genre !== undefined) updates.genre = body.genre;
  if (body.role !== undefined) updates.role = body.role;
  if (body.is_featured !== undefined) updates.is_featured = body.is_featured;
  if (body.is_public !== undefined) updates.is_public = body.is_public;
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order;

  const { data: track, error } = await supabase
    .from("portfolio_tracks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ track });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get track to verify ownership and get storage path
  const { data: track } = await supabase
    .from("portfolio_tracks")
    .select("user_id, audio_url")
    .eq("id", id)
    .single();

  if (!track || track.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Try to delete from storage
  if (track.audio_url) {
    try {
      const url = new URL(track.audio_url);
      const pathParts = url.pathname.split("/");
      const bucketIndex = pathParts.indexOf("portfolio-tracks");
      if (bucketIndex !== -1) {
        const storagePath = pathParts.slice(bucketIndex + 1).join("/");
        await supabase.storage.from("portfolio-tracks").remove([storagePath]);
      }
    } catch {}
  }

  const { error } = await supabase
    .from("portfolio_tracks")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
