import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MembershipsClient from "./MembershipsClient";

export const metadata: Metadata = {
  title: "Staff — Memberships",
  robots: { index: false, follow: false },
};

const STAFF_EMAILS = (process.env.STAFF_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default async function StaffMembershipsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/staff/memberships");
  }

  // Gate: only staff emails can access
  if (STAFF_EMAILS.length > 0 && !STAFF_EMAILS.includes((user.email || "").toLowerCase())) {
    return (
      <div className="min-h-screen carbon-fiber flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="text-5xl mb-6">🚫</p>
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-[#F0E6D3] uppercase tracking-wider mb-3">
            Not Authorized
          </h1>
          <p className="text-[#F0E6D3]/40 font-[family-name:var(--font-mono)] text-sm">
            This page is for staff only. If you need access, ask the team in Discord.
          </p>
        </div>
      </div>
    );
  }

  // Pull all subscriptions for the staff view
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("user_id, tier, status, stripe_subscription_id, current_period_end, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(200);

  // Pull profiles for the user list — join in JS to avoid RLS join issues
  const userIds = Array.from(new Set((subscriptions || []).map((s) => s.user_id)));
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, display_name, email, avatar_url").in("id", userIds)
    : { data: [] };

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
  const rows = (subscriptions || []).map((s) => ({
    ...s,
    profile: profileMap.get(s.user_id) || null,
  }));

  return <MembershipsClient initialRows={rows} currentUserEmail={user.email || ""} />;
}