import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();

  const { username, sender_name, sender_email, message, project_type, budget_range } = body;

  if (!username || !sender_name || !sender_email || !message) {
    return NextResponse.json(
      { error: "username, sender_name, sender_email, and message are required" },
      { status: 400 }
    );
  }

  // Find the portfolio user
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .ilike("display_name", username.replace(/-/g, " "));

  const slugify = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const profile = profiles?.find(
    (p) => slugify(p.display_name || "") === username.toLowerCase()
  );

  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Verify contact form is enabled
  const { data: settings } = await supabase
    .from("portfolio_settings")
    .select("contact_form_enabled")
    .eq("user_id", profile.id)
    .single();

  if (settings && !settings.contact_form_enabled) {
    return NextResponse.json(
      { error: "Contact form is disabled for this user" },
      { status: 403 }
    );
  }

  const { data: contact, error } = await supabase
    .from("portfolio_contacts")
    .insert({
      portfolio_user_id: profile.id,
      sender_name,
      sender_email,
      message,
      project_type: project_type || null,
      budget_range: budget_range || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ contact }, { status: 201 });
}
