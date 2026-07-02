import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type") || "all";
    const genre = searchParams.get("genre");
    const specialty = searchParams.get("specialty");
    const budgetMin = searchParams.get("budget_min");
    const budgetMax = searchParams.get("budget_max");
    const sort = searchParams.get("sort") || "newest";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;

    let query = supabase
      .from("classifieds")
      .select(
        `
        *,
        author:profiles!classifieds_author_id_fkey(id, display_name, avatar_url, created_at)
        `,
        { count: "exact" }
      )
      .eq("status", "active");

    // Filter by listing type
    if (type === "lfw" || type === "lfm") {
      query = query.eq("listing_type", type);
    }

    // Filter by genre (array contains)
    if (genre) {
      query = query.contains("genres", [genre]);
    }

    // Filter by specialty (array contains)
    if (specialty) {
      query = query.contains("specialties", [specialty]);
    }

    // Budget filters (for LFM listings)
    if (budgetMin) {
      query = query.gte("budget_min", parseFloat(budgetMin));
    }
    if (budgetMax) {
      query = query.lte("budget_max", parseFloat(budgetMax));
    }

    // Sort
    switch (sort) {
      case "featured":
        query = query
          .order("is_featured", { ascending: false })
          .order("is_bumped", { ascending: false })
          .order("created_at", { ascending: false });
        break;
      case "bumped":
        query = query
          .order("is_bumped", { ascending: false })
          .order("created_at", { ascending: false });
        break;
      case "newest":
      default:
        query = query
          .order("is_featured", { ascending: false })
          .order("is_bumped", { ascending: false })
          .order("created_at", { ascending: false });
        break;
    }

    query = query.range(offset, offset + limit - 1);

    const { data: listings, error, count } = await query;

    if (error) {
      console.error("Error fetching classifieds:", error);
      return NextResponse.json(
        { error: `Failed to fetch classifieds: ${error.message}` },
        { status: 500 }
      );
    }

    // Fetch average ratings and review counts for each listing
    const listingsWithStats = await Promise.all(
      (listings ?? []).map(async (listing: any) => {
        const { data: reviews } = await supabase
          .from("classified_reviews")
          .select("rating")
          .eq("listing_id", listing.id);

        const reviewCount = reviews?.length ?? 0;
        const avgRating =
          reviewCount > 0
            ? reviews!.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewCount
            : null;

        return {
          ...listing,
          avg_rating: avgRating ? Math.round(avgRating * 10) / 10 : null,
          review_count: reviewCount,
        };
      })
    );

    const total = count ?? 0;
    const hasMore = offset + limit < total;

    return NextResponse.json({ data: listingsWithStats, total, page, limit, hasMore });
  } catch (err: any) {
    console.error("Classifieds GET error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      listing_type,
      title,
      description,
      genres,
      rate_per_song,
      rate_per_hour,
      rate_per_stem,
      turnaround_days,
      budget_min,
      budget_max,
      deadline,
      specialties,
      portfolio_url,
      reference_tracks,
    } = body;

    // Validation
    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!description?.trim()) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }
    if (!listing_type || !["lfw", "lfm"].includes(listing_type)) {
      return NextResponse.json(
        { error: "Listing type must be 'lfw' or 'lfm'" },
        { status: 400 }
      );
    }

    const { data: listing, error } = await supabase
      .from("classifieds")
      .insert({
        author_id: session.user.id,
        listing_type,
        title: title.trim(),
        description: description.trim(),
        genres: genres || [],
        rate_per_song: rate_per_song ?? null,
        rate_per_hour: rate_per_hour ?? null,
        rate_per_stem: rate_per_stem ?? null,
        turnaround_days: turnaround_days ?? null,
        budget_min: budget_min ?? null,
        budget_max: budget_max ?? null,
        deadline: deadline ?? null,
        specialties: specialties || [],
        portfolio_url: portfolio_url?.trim() || null,
        reference_tracks: reference_tracks?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating classified:", error);
      return NextResponse.json(
        { error: `Failed to create listing: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(listing, { status: 201 });
  } catch (err: any) {
    console.error("Classifieds POST error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
