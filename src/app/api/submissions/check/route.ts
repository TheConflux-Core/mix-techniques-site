import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/submissions/check?episode_id=xxx — check if current user already submitted to this episode
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ exists: false });
    }

    const { searchParams } = new URL(request.url);
    const episodeId = searchParams.get("episode_id");
    if (!episodeId) {
      return NextResponse.json({ exists: false });
    }

    const userEmail = user.email;
    if (!userEmail) {
      return NextResponse.json({ exists: false });
    }

    const { data, error } = await supabase
      .from("submissions")
      .select("id")
      .eq("email", userEmail)
      .eq("episode_id", episodeId)
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({ exists: true, submission_id: data.id });
  } catch (err: any) {
    return NextResponse.json({ exists: false });
  }
}
