import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateSlug } from "@/lib/forum-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get current user (optional)
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id ?? null;

    const { data: thread, error } = await supabase
      .from("forum_threads")
      .select(
        `
        *,
        author:profiles!forum_threads_author_id_fkey(id, display_name, avatar_url),
        category:forum_categories!forum_threads_category_id_fkey(id, name, slug, icon, color)
        `
      )
      .eq("id", id)
      .single();

    if (error || !thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Increment view count (fire-and-forget)
    supabase
      .from("forum_threads")
      .update({ view_count: (thread.view_count ?? 0) + 1 })
      .eq("id", id)
      .then(() => {});

    // Get user's vote on this thread
    let userVote: number | null = null;
    if (userId) {
      const { data: vote } = await supabase
        .from("forum_votes")
        .select("vote_type")
        .eq("user_id", userId)
        .eq("target_id", id)
        .eq("target_type", "thread")
        .limit(1)
        .maybeSingle();

      userVote = vote?.vote_type ?? null;
    }

    return NextResponse.json({
      ...thread,
      user_vote: userVote,
    });
  } catch (err: any) {
    console.error("Forum thread GET error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch existing thread
    const { data: thread, error: fetchError } = await supabase
      .from("forum_threads")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Only the author can update
    if (thread.author_id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const updates: Record<string, any> = {};

    if (body.title !== undefined) {
      updates.title = body.title.trim();
      // Update slug if title changed
      if (body.title.trim() !== thread.title) {
        let slug = generateSlug(body.title);
        const { data: existing } = await supabase
          .from("forum_threads")
          .select("id")
          .eq("slug", slug)
          .neq("id", id)
          .limit(1)
          .maybeSingle();

        if (existing) {
          slug = `${slug}-${Math.random().toString(36).slice(2, 8)}`;
        }
        updates.slug = slug;
      }
    }

    if (body.body !== undefined) {
      updates.body = body.body.trim();
    }

    if (body.is_locked !== undefined) {
      updates.is_locked = body.is_locked;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from("forum_threads")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating thread:", error);
      return NextResponse.json(
        { error: `Failed to update thread: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("Forum thread PUT error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch existing thread
    const { data: thread, error: fetchError } = await supabase
      .from("forum_threads")
      .select("author_id")
      .eq("id", id)
      .single();

    if (fetchError || !thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Only the author can delete
    if (thread.author_id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase
      .from("forum_threads")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting thread:", error);
      return NextResponse.json(
        { error: `Failed to delete thread: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Forum thread DELETE error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
