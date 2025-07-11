// /api/gallery/favorite.ts

import { supabaseServer } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = supabaseServer();
  const { itemId, isFavorite } = await req.json();

  const { error } = await supabase
    .from("gallery_items")
    .update({ is_favorite: isFavorite })
    .eq("id", itemId);

  if (error) {
    console.error("Favorite update failed:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
