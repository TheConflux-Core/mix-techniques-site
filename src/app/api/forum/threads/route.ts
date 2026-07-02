import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateSlug } from "@/lib/forum-utils";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const sort = searchParams.get("sort") || "newest";
    const offset = (page - 1) * limit;

    // Get current user (optional)
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id ?? null;

    // Build query
    let query = supabase
      .from("forum_threads")
      .select(
        `
        *,
        author:profiles!forum_threads_author_id_fkey(id, display_name, avatar_url),
        category:forum_categories!forum_threads_category_id_fkey(id, name, slug, icon, color)
        `,
        { count: "exact" }
      );

    // Filter by category slug
    if (category) {
      const { data: cat } = await supabase
        .from("forum_categories")
        .select("id")
        .eq("slug", category)
        .single();

      if (cat) {
        query = query.eq("category_id", cat.id);
      } else {
        return NextResponse.json({ data: [], total: 0, page, limit, hasMore: false });
      }
    }

    // Sort
    switch (sort) {
      case "active":
        query = query
          .order("is_pinned", { ascending: false })
          .order("last_reply_at", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false });
        break;
      case "unanswered":
        query = query
          .eq("reply_count", 0)
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false });
        break;
      case "newest":
      default:
        query = query
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false });
        break;
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: threads, error, count } = await query;

    if (error) {
      console.error("Error fetching threads:", error);
      return NextResponse.json(
        { error: `Failed to fetch threads: ${error.message}` },
        { status: 500 }
      );
    }

    // Fetch user votes for these threads if authenticated
    let userVotes: Record<string, number> = {};
    if (userId && threads && threads.length > 0) {
      const threadIds = threads.map((t: any) => t.id);
      const { data: votes } = await supabase
        .from("forum_votes")
        .select("target_id, vote_type")
        .eq("user_id", userId)
        .eq("target_type", "thread")
        .in("target_id", threadIds);

      if (votes) {
        for (const v of votes) {
          userVotes[v.target_id] = v.vote_type;
        }
      }
    }

    // Attach user_vote to each thread
    const result = (threads ?? []).map((t: any) => ({
      ...t,
      user_vote: userVotes[t.id] ?? null,
    }));

    const total = count ?? 0;
    const hasMore = offset + limit < total;

    return NextResponse.json({ data: result, total, page, limit, hasMore });
  } catch (err: any) {
    console.error("Forum threads GET error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { category_id, title, body: threadBody } = body;

    // Validation
    if (!category_id) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }
    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!threadBody?.trim()) {
      return NextResponse.json({ error: "Body is required" }, { status: 400 });
    }

    // Verify category exists
    const { data: category } = await supabase
      .from("forum_categories")
      .select("id")
      .eq("id", category_id)
      .single();

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 400 });
    }

    // Generate slug (ensure uniqueness by appending random suffix if needed)
    let slug = generateSlug(title);
    const { data: existing } = await supabase
      .from("forum_threads")
      .select("id")
      .eq("slug", slug)
      .limit(1)
      .single();

    if (existing) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 8)}`;
    }

    const { data: thread, error } = await supabase
      .from("forum_threads")
      .insert({
        category_id,
        author_id: session.user.id,
        title: title.trim(),
        slug,
        body: threadBody.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating thread:", error);
      return NextResponse.json(
        { error: `Failed to create thread: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(thread, { status: 201 });
  } catch (err: any) {
    console.error("Forum threads POST error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
