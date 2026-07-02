import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: threadId } = await params;
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const offset = (page - 1) * limit;

    // Get current user (optional)
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id ?? null;

    // Fetch replies with author profiles
    const { data: replies, error, count } = await supabase
      .from("forum_replies")
      .select(
        `
        *,
        author:profiles!forum_replies_author_id_fkey(id, display_name, avatar_url)
        `,
        { count: "exact" }
      )
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching replies:", error);
      return NextResponse.json(
        { error: `Failed to fetch replies: ${error.message}` },
        { status: 500 }
      );
    }

    // Fetch user votes for these replies if authenticated
    let userVotes: Record<string, number> = {};
    if (userId && replies && replies.length > 0) {
      const replyIds = replies.map((r: any) => r.id);
      const { data: votes } = await supabase
        .from("forum_votes")
        .select("target_id, vote_type")
        .eq("user_id", userId)
        .eq("target_type", "reply")
        .in("target_id", replyIds);

      if (votes) {
        for (const v of votes) {
          userVotes[v.target_id] = v.vote_type;
        }
      }
    }

    // Attach user_vote to each reply
    const result = (replies ?? []).map((r: any) => ({
      ...r,
      user_vote: userVotes[r.id] ?? null,
    }));

    const total = count ?? 0;
    const hasMore = offset + limit < total;

    return NextResponse.json({ data: result, total, page, limit, hasMore });
  } catch (err: any) {
    console.error("Forum replies GET error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: threadId } = await params;
    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check thread exists and is not locked
    const { data: thread, error: threadError } = await supabase
      .from("forum_threads")
      .select("id, is_locked")
      .eq("id", threadId)
      .single();

    if (threadError || !thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    if (thread.is_locked) {
      return NextResponse.json(
        { error: "This thread is locked and cannot receive new replies" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { body: replyBody, parent_id } = body;

    if (!replyBody?.trim()) {
      return NextResponse.json({ error: "Reply body is required" }, { status: 400 });
    }

    // If parent_id provided, verify the parent reply exists in this thread
    if (parent_id) {
      const { data: parentReply } = await supabase
        .from("forum_replies")
        .select("id")
        .eq("id", parent_id)
        .eq("thread_id", threadId)
        .single();

      if (!parentReply) {
        return NextResponse.json(
          { error: "Parent reply not found in this thread" },
          { status: 400 }
        );
      }
    }

    const { data: reply, error } = await supabase
      .from("forum_replies")
      .insert({
        thread_id: threadId,
        author_id: session.user.id,
        parent_id: parent_id || null,
        body: replyBody.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating reply:", error);
      return NextResponse.json(
        { error: `Failed to create reply: ${error.message}` },
        { status: 500 }
      );
    }

    // Update thread's reply_count and last_reply_at (fire-and-forget)
    supabase
      .from("forum_threads")
      .update({
        last_reply_at: new Date().toISOString(),
        last_reply_by: session.user.id,
      })
      .eq("id", threadId)
      .then(() => {});

    // Increment reply_count via RPC or manual update
    const { data: currentThread } = await supabase
      .from("forum_threads")
      .select("reply_count")
      .eq("id", threadId)
      .single();

    if (currentThread) {
      supabase
        .from("forum_threads")
        .update({ reply_count: (currentThread.reply_count ?? 0) + 1 })
        .eq("id", threadId)
        .then(() => {});
    }

    return NextResponse.json(reply, { status: 201 });
  } catch (err: any) {
    console.error("Forum replies POST error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
