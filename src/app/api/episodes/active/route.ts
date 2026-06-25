import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const STATUS_PRIORITY = ["live", "ready", "post_production", "published"] as const;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// GET /api/episodes/active — get the most relevant episode for the vote page
export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch candidates from each priority tier in parallel
    const results = await Promise.all(
      STATUS_PRIORITY.map((status) =>
        supabase
          .from("episodes")
          .select(
            "id, season_id, episode_number, title, description, air_date, status, youtube_url, podcast_url, guest_judges, created_at, submissions_open"
          )
          .eq("status", status)
          .order("episode_number", { ascending: false })
          .limit(1)
          .maybeSingle()
      )
    );

    // Pick the first non-null result (highest priority wins)
    let episode = null;
    for (const { data } of results) {
      if (data) {
        episode = data;
        break;
      }
    }

    if (!episode) {
      return NextResponse.json({ episode: null }, { headers: CORS_HEADERS });
    }

    return NextResponse.json({ episode }, { headers: CORS_HEADERS });
  } catch (err: unknown) {
    console.error("Active episode error:", err);
    return NextResponse.json(
      { episode: null, error: "Internal server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
