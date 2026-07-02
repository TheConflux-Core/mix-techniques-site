import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    // Fetch existing reply
    const { data: reply, error: fetchError } = await supabase
      .from("forum_replies")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !reply) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }

    // Only the author can update
    if (reply.author_id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { body: replyBody } = body;

    if (!replyBody?.trim()) {
      return NextResponse.json({ error: "Reply body is required" }, { status: 400 });
    }

    const { data: updated, error } = await supabase
      .from("forum_replies")
      .update({
        body: replyBody.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating reply:", error);
      return NextResponse.json(
        { error: `Failed to update reply: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("Forum reply PUT error:", err?.message || err);
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

    // Fetch existing reply
    const { data: reply, error: fetchError } = await supabase
      .from("forum_replies")
      .select("author_id, thread_id")
      .eq("id", id)
      .single();

    if (fetchError || !reply) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }

    // Only the author can delete
    if (reply.author_id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase
      .from("forum_replies")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting reply:", error);
      return NextResponse.json(
        { error: `Failed to delete reply: ${error.message}` },
        { status: 500 }
      );
    }

    // Decrement reply_count on the thread (best-effort)
    const { data: thread } = await supabase
      .from("forum_threads")
      .select("reply_count")
      .eq("id", reply.thread_id)
      .single();

    if (thread && thread.reply_count > 0) {
      supabase
        .from("forum_threads")
        .update({ reply_count: thread.reply_count - 1 })
        .eq("id", reply.thread_id)
        .then(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Forum reply DELETE error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
