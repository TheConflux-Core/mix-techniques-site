import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/forum/threads/by-slug?category=slug&thread=slug
// Looks up a single thread by category slug + thread slug
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get("category");
    const threadSlug = searchParams.get("thread");

    if (!categorySlug || !threadSlug) {
      return NextResponse.json(
        { error: "Both 'category' and 'thread' params are required" },
        { status: 400 }
      );
    }

    // Get current user (optional)
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id ?? null;

    // Look up category
    const { data: category } = await supabase
      .from("forum_categories")
      .select("id, name, slug, icon, color")
      .eq("slug", categorySlug)
      .single();

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Look up thread by slug + category
    const { data: thread, error } = await supabase
      .from("forum_threads")
      .select(
        `
        *,
        author:profiles!forum_threads_author_id_fkey(id, display_name, avatar_url, created_at),
        category:forum_categories!forum_threads_category_id_fkey(id, name, slug, icon, color)
        `
      )
      .eq("slug", threadSlug)
      .eq("category_id", category.id)
      .single();

    if (error || !thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Increment view count (fire-and-forget)
    supabase
      .from("forum_threads")
      .update({ view_count: (thread.view_count ?? 0) + 1 })
      .eq("id", thread.id)
      .then(() => {});

    // Get user's vote on this thread
    let userVote: number | null = null;
    if (userId) {
      const { data: vote } = await supabase
        .from("forum_votes")
        .select("vote_type")
        .eq("user_id", userId)
        .eq("target_id", thread.id)
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
    console.error("Forum thread by-slug GET error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
