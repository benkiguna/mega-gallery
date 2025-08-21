import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = supabaseServer();
  
  try {
    // Get all tags with their usage counts
    const { data: tagStats, error } = await supabase
      .from("tags")
      .select(`
        id,
        name,
        color,
        image_tags(count)
      `);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Transform the data to include counts
    const tagsWithCounts = (tagStats || []).map(tag => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      count: Array.isArray(tag.image_tags) ? tag.image_tags.length : 0
    })).sort((a, b) => b.count - a.count); // Sort by usage count, most used first

    return NextResponse.json({ success: true, data: tagsWithCounts });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch tag statistics" },
      { status: 500 }
    );
  }
}