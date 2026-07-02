import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;

    const { data: reviews, error, count } = await supabase
      .from("classified_reviews")
      .select(
        `
        *,
        reviewer:profiles!classified_reviews_reviewer_id_fkey(id, display_name, avatar_url)
        `,
        { count: "exact" }
      )
      .eq("listing_id", listingId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching reviews:", error);
      return NextResponse.json(
        { error: `Failed to fetch reviews: ${error.message}` },
        { status: 500 }
      );
    }

    const total = count ?? 0;
    const hasMore = offset + limit < total;

    return NextResponse.json({ data: reviews ?? [], total, page, limit, hasMore });
  } catch (err: any) {
    console.error("Reviews GET error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify listing exists and get author
    const { data: listing } = await supabase
      .from("classifieds")
      .select("id, author_id")
      .eq("id", listingId)
      .single();

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Can't review yourself
    if (listing.author_id === session.user.id) {
      return NextResponse.json(
        { error: "You cannot review your own listing" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { rating, review_text, project_type } = body;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const { data: review, error } = await supabase
      .from("classified_reviews")
      .insert({
        listing_id: listingId,
        reviewer_id: session.user.id,
        reviewee_id: listing.author_id,
        rating,
        review_text: review_text?.trim() || null,
        project_type: project_type?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      // Handle duplicate review
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "You have already reviewed this listing" },
          { status: 400 }
        );
      }
      console.error("Error creating review:", error);
      return NextResponse.json(
        { error: `Failed to create review: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(review, { status: 201 });
  } catch (err: any) {
    console.error("Reviews POST error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
