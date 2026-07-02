import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: settings, error } = await supabase
    .from("portfolio_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: settings || null });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check subscription tier
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("tier, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  const tier = subscription?.tier || "free";

  if (tier === "free") {
    return NextResponse.json(
      { error: "Pro or Studio subscription required" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const allowedFields = [
    "theme", "layout", "headline", "custom_bio", "gear_list",
    "client_testimonials", "contact_email", "contact_form_enabled",
    "show_rates", "hourly_rate", "per_song_rate", "custom_domain",
    "analytics_enabled", "social_links", "show_badge",
  ];

  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  if (tier !== "studio" && updates.custom_domain) {
    delete updates.custom_domain;
  }

  // Upsert settings
  const { data: settings, error } = await supabase
    .from("portfolio_settings")
    .upsert({ user_id: user.id, ...updates }, { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings });
}
