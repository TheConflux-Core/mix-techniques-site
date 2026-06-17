import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

// GET /api/submissions/check?episode_id=xxx — check if current user already submitted to this episode
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const db = createServiceClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ exists: false });
    }

    const { searchParams } = new URL(request.url);
    const episodeId = searchParams.get("episode_id");
    if (!episodeId) {
      return NextResponse.json({ exists: false });
    }

    // Use email for duplicate check (user_id column not yet in DB)
    const userEmail = session.user.email;
    if (!userEmail) {
      return NextResponse.json({ exists: false });
    }

    const { data, error } = await db
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
