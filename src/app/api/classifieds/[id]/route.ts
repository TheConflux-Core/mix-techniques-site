import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: listing, error } = await supabase
      .from("classifieds")
      .select(
        `
        *,
        author:profiles!classifieds_author_id_fkey(id, display_name, avatar_url, bio, location, created_at)
        `
      )
      .eq("id", id)
      .single();

    if (error || !listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Increment view count (fire-and-forget)
    supabase
      .from("classifieds")
      .update({ view_count: (listing.view_count ?? 0) + 1 })
      .eq("id", id)
      .then(() => {});

    // Fetch review stats
    const { data: reviews } = await supabase
      .from("classified_reviews")
      .select("rating")
      .eq("listing_id", id);

    const reviewCount = reviews?.length ?? 0;
    const avgRating =
      reviewCount > 0
        ? reviews!.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewCount
        : null;

    return NextResponse.json({
      ...listing,
      avg_rating: avgRating ? Math.round(avgRating * 10) / 10 : null,
      review_count: reviewCount,
    });
  } catch (err: any) {
    console.error("Classified GET error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from("classifieds")
      .select("author_id")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    if (existing.author_id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const allowedFields = [
      "title", "description", "genres", "rate_per_song", "rate_per_hour",
      "rate_per_stem", "turnaround_days", "budget_min", "budget_max",
      "deadline", "specialties", "portfolio_url", "reference_tracks", "status",
    ];

    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data: listing, error } = await supabase
      .from("classifieds")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating classified:", error);
      return NextResponse.json(
        { error: `Failed to update listing: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(listing);
  } catch (err: any) {
    console.error("Classified PUT error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: existing } = await supabase
      .from("classifieds")
      .select("author_id")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    if (existing.author_id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase.from("classifieds").delete().eq("id", id);

    if (error) {
      console.error("Error deleting classified:", error);
      return NextResponse.json(
        { error: `Failed to delete listing: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Classified DELETE error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
