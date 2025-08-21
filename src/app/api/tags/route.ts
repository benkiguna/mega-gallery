import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = supabaseServer();
  
  try {
    const { data: tags, error } = await supabase
      .from("tags")
      .select("*")
      .order("name");

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: tags });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const supabase = supabaseServer();
  
  try {
    const { name, color = "#3b82f6" } = await req.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Tag name is required" },
        { status: 400 }
      );
    }

    const { data: tag, error } = await supabase
      .from("tags")
      .insert({ name: name.trim(), color })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") { // unique constraint violation
        return NextResponse.json(
          { success: false, error: "Tag already exists" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: tag });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to create tag" },
      { status: 500 }
    );
  }
}