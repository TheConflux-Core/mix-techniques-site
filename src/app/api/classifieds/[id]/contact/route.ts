import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    // Verify listing exists
    const { data: listing } = await supabase
      .from("classifieds")
      .select("id, author_id, status")
      .eq("id", listingId)
      .single();

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.status !== "active") {
      return NextResponse.json(
        { error: "This listing is no longer active" },
        { status: 400 }
      );
    }

    // Can't contact yourself
    if (listing.author_id === session.user.id) {
      return NextResponse.json(
        { error: "You cannot contact your own listing" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { message } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const { data: contact, error } = await supabase
      .from("classified_contacts")
      .insert({
        listing_id: listingId,
        sender_id: session.user.id,
        receiver_id: listing.author_id,
        message: message.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating contact:", error);
      return NextResponse.json(
        { error: `Failed to send message: ${error.message}` },
        { status: 500 }
      );
    }

    // Increment contact_count (fire-and-forget)
    supabase
      .from("classifieds")
      .update({ contact_count: (listing as any).contact_count ?? 0 + 1 })
      .eq("id", listingId)
      .then(() => {});

    return NextResponse.json(contact, { status: 201 });
  } catch (err: any) {
    console.error("Contact POST error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
