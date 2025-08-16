import { supabaseServer } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const supabase = supabaseServer();

  try {
    const { data: links, error } = await supabase
      .from("user_links")
      .select("id, name, url, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching links:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: links || [] });
  } catch (err) {
    console.error("Unhandled error:", err);
    return NextResponse.json(
      { success: false, error: "Unexpected server error." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const supabase = supabaseServer();

  try {
    const { name, url } = await req.json();

    if (!name || !url) {
      return NextResponse.json(
        { success: false, error: "Name and URL are required" },
        { status: 400 }
      );
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid URL format" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("user_links")
      .insert([
        {
          name: name.trim(),
          url: url.trim(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error inserting link:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Unhandled error:", err);
    return NextResponse.json(
      { success: false, error: "Unexpected server error." },
      { status: 500 }
    );
  }
} 