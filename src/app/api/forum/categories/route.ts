import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("forum_categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching forum categories:", error);
      return NextResponse.json(
        { error: `Failed to fetch categories: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (err: any) {
    console.error("Forum categories error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
