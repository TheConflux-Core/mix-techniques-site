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
    const { target_id, target_type, vote_type } = body;

    // Validation
    if (!target_id) {
      return NextResponse.json({ error: "target_id is required" }, { status: 400 });
    }
    if (target_type !== "thread" && target_type !== "reply") {
      return NextResponse.json({ error: "target_type must be 'thread' or 'reply'" }, { status: 400 });
    }
    if (vote_type !== 1 && vote_type !== -1) {
      return NextResponse.json({ error: "vote_type must be 1 or -1" }, { status: 400 });
    }

    // Check for existing vote
    const { data: existingVote } = await supabase
      .from("forum_votes")
      .select("id, vote_type")
      .eq("user_id", session.user.id)
      .eq("target_id", target_id)
      .eq("target_type", target_type)
      .limit(1)
      .maybeSingle();

    let newVoteType: number | null = vote_type;
    let action: "created" | "removed" | "updated" = "created";

    if (existingVote) {
      if (existingVote.vote_type === vote_type) {
        // Same vote → toggle off (remove)
        const { error } = await supabase
          .from("forum_votes")
          .delete()
          .eq("id", existingVote.id);

        if (error) {
          console.error("Error removing vote:", error);
          return NextResponse.json(
            { error: `Failed to remove vote: ${error.message}` },
            { status: 500 }
          );
        }

        newVoteType = null;
        action = "removed";
      } else {
        // Opposite vote → flip
        const { error } = await supabase
          .from("forum_votes")
          .update({ vote_type })
          .eq("id", existingVote.id);

        if (error) {
          console.error("Error updating vote:", error);
          return NextResponse.json(
            { error: `Failed to update vote: ${error.message}` },
            { status: 500 }
          );
        }

        action = "updated";
      }
    } else {
      // No existing vote → create
      const { error } = await supabase
        .from("forum_votes")
        .insert({
          user_id: session.user.id,
          target_id,
          target_type,
          vote_type,
        });

      if (error) {
        console.error("Error creating vote:", error);
        return NextResponse.json(
          { error: `Failed to create vote: ${error.message}` },
          { status: 500 }
        );
      }

      action = "created";
    }

    // Recalculate vote_score on the target
    const { data: votes } = await supabase
      .from("forum_votes")
      .select("vote_type")
      .eq("target_id", target_id)
      .eq("target_type", target_type);

    const newScore = (votes ?? []).reduce((sum: number, v: any) => sum + v.vote_type, 0);
    const tableName = target_type === "thread" ? "forum_threads" : "forum_replies";

    supabase
      .from(tableName)
      .update({ vote_score: newScore })
      .eq("id", target_id)
      .then(() => {});

    return NextResponse.json({
      vote_type: newVoteType,
      vote_score: newScore,
      action,
    });
  } catch (err: any) {
    console.error("Forum vote POST error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { target_id, target_type } = body;

    if (!target_id) {
      return NextResponse.json({ error: "target_id is required" }, { status: 400 });
    }
    if (target_type !== "thread" && target_type !== "reply") {
      return NextResponse.json({ error: "target_type must be 'thread' or 'reply'" }, { status: 400 });
    }

    const { error } = await supabase
      .from("forum_votes")
      .delete()
      .eq("user_id", session.user.id)
      .eq("target_id", target_id)
      .eq("target_type", target_type);

    if (error) {
      console.error("Error deleting vote:", error);
      return NextResponse.json(
        { error: `Failed to delete vote: ${error.message}` },
        { status: 500 }
      );
    }

    // Recalculate vote_score
    const { data: votes } = await supabase
      .from("forum_votes")
      .select("vote_type")
      .eq("target_id", target_id)
      .eq("target_type", target_type);

    const newScore = (votes ?? []).reduce((sum: number, v: any) => sum + v.vote_type, 0);
    const tableName = target_type === "thread" ? "forum_threads" : "forum_replies";

    supabase
      .from(tableName)
      .update({ vote_score: newScore })
      .eq("id", target_id)
      .then(() => {});

    return NextResponse.json({ vote_type: null, vote_score: newScore, action: "removed" });
  } catch (err: any) {
    console.error("Forum vote DELETE error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
