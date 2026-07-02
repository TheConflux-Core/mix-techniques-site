import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserTier } from "@/lib/subscription";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const supabase = await createClient();

  // Find profile by slugified display_name
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .ilike("display_name", username.replace(/-/g, " "));

  if (profileError || !profiles || profiles.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const slugify = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const profile = profiles.find(
    (p) => slugify(p.display_name || "") === username.toLowerCase()
  );

  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check subscription tier (via RPC — handles trialing + past_due correctly)
  const tier = await getUserTier(supabase, profile.id);

  if (tier === "free") {
    return NextResponse.json({
      profile,
      tier,
      settings: null,
      tracks: [],
    });
  }

  // Fetch portfolio settings
  const { data: settings } = await supabase
    .from("portfolio_settings")
    .select("*")
    .eq("user_id", profile.id)
    .single();

  // Fetch public tracks
  const { data: tracks } = await supabase
    .from("portfolio_tracks")
    .select("*")
    .eq("user_id", profile.id)
    .eq("is_public", true)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true });

  // Increment page_view analytics
  if (settings?.analytics_enabled) {
    await supabase.from("portfolio_analytics").insert({
      user_id: profile.id,
      event_type: "page_view",
      referrer: request.headers.get("referer") || null,
    });
  }

  return NextResponse.json({
    profile,
    tier,
    settings,
    tracks: tracks || [],
  });
}
