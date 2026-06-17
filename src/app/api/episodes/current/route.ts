import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/episodes/current — get the current open episode for submissions
export async function GET() {
  try {
    const supabase = await createClient();

    // Get the most recent episode where submissions are open
    const { data, error } = await supabase
      .from("episodes")
      .select("id, episode_number, title, description, status, season_id, submissions_open")
      .eq("submissions_open", true)
      .order("episode_number", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({ episode: null, accepting: false });
    }

    return NextResponse.json({ episode: data, accepting: true });
  } catch (err: any) {
    console.error("Current episode error:", err);
    return NextResponse.json({ episode: null, accepting: false });
  }
}
