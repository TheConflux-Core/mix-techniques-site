import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's listings
    const { data: listings, error: listingsError } = await supabase
      .from("classifieds")
      .select(
        `
        *,
        author:profiles!classifieds_author_id_fkey(id, display_name, avatar_url)
        `
      )
      .eq("author_id", session.user.id)
      .order("created_at", { ascending: false });

    if (listingsError) {
      console.error("Error fetching my listings:", listingsError);
      return NextResponse.json(
        { error: `Failed to fetch listings: ${listingsError.message}` },
        { status: 500 }
      );
    }

    // Get messages received on user's listings
    const listingIds = (listings ?? []).map((l: any) => l.id);
    let messages: any[] = [];
    if (listingIds.length > 0) {
      const { data: contacts } = await supabase
        .from("classified_contacts")
        .select(
          `
          *,
          sender:profiles!classified_contacts_sender_id_fkey(id, display_name, avatar_url),
          listing:classifieds!classified_contacts_listing_id_fkey(id, title, listing_type)
          `
        )
        .in("listing_id", listingIds)
        .order("created_at", { ascending: false })
        .limit(50);

      messages = contacts ?? [];
    }

    // Get reviews on user's listings
    let reviews: any[] = [];
    if (listingIds.length > 0) {
      const { data: reviewData } = await supabase
        .from("classified_reviews")
        .select(
          `
          *,
          reviewer:profiles!classified_reviews_reviewer_id_fkey(id, display_name, avatar_url),
          listing:classifieds!classified_reviews_listing_id_fkey(id, title)
          `
        )
        .in("listing_id", listingIds)
        .order("created_at", { ascending: false })
        .limit(50);

      reviews = reviewData ?? [];
    }

    return NextResponse.json({
      listings: listings ?? [],
      messages,
      reviews,
    });
  } catch (err: any) {
    console.error("My classifieds GET error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
