import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserTier } from "@/lib/subscription";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check studio tier (via RPC — handles trialing + past_due correctly)
  const tier = await getUserTier(supabase, user.id);

  if (tier !== "studio") {
    return NextResponse.json(
      { error: "Studio subscription required" },
      { status: 403 }
    );
  }

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Views this week
  const { count: viewsWeek } = await supabase
    .from("portfolio_analytics")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("event_type", "page_view")
    .gte("created_at", weekAgo);

  // Views this month
  const { count: viewsMonth } = await supabase
    .from("portfolio_analytics")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("event_type", "page_view")
    .gte("created_at", monthAgo);

  // Total plays
  const { count: totalPlays } = await supabase
    .from("portfolio_analytics")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("event_type", "track_play")
    .gte("created_at", monthAgo);

  // Top tracks by play count
  const { data: topTracks } = await supabase
    .from("portfolio_tracks")
    .select("id, title, play_count, download_count")
    .eq("user_id", user.id)
    .order("play_count", { ascending: false })
    .limit(5);

  // Referrers
  const { data: referrerData } = await supabase
    .from("portfolio_analytics")
    .select("referrer")
    .eq("user_id", user.id)
    .eq("event_type", "page_view")
    .gte("created_at", monthAgo)
    .not("referrer", "is", null);

  const referrerCounts: Record<string, number> = {};
  (referrerData || []).forEach((r) => {
    if (r.referrer) {
      try {
        const host = new URL(r.referrer).hostname;
        referrerCounts[host] = (referrerCounts[host] || 0) + 1;
      } catch {
        referrerCounts[r.referrer] = (referrerCounts[r.referrer] || 0) + 1;
      }
    }
  });

  const referrers = Object.entries(referrerCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([source, count]) => ({ source, count }));

  // Daily views for chart (last 30 days)
  const { data: dailyViews } = await supabase
    .from("portfolio_analytics")
    .select("created_at")
    .eq("user_id", user.id)
    .eq("event_type", "page_view")
    .gte("created_at", monthAgo);

  const viewsByDay: Record<string, number> = {};
  (dailyViews || []).forEach((v) => {
    const day = v.created_at.slice(0, 10);
    viewsByDay[day] = (viewsByDay[day] || 0) + 1;
  });

  return NextResponse.json({
    viewsWeek: viewsWeek || 0,
    viewsMonth: viewsMonth || 0,
    totalPlays: totalPlays || 0,
    topTracks: topTracks || [],
    referrers,
    viewsByDay,
  });
}
