import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = supabaseServer();
  
  try {
    const { imageId, tagId } = await req.json();

    if (!imageId || !tagId) {
      return NextResponse.json(
        { success: false, error: "Image ID and Tag ID are required" },
        { status: 400 }
      );
    }

    const { data: imageTag, error } = await supabase
      .from("image_tags")
      .insert({ image_id: imageId, tag_id: tagId })
      .select(`
        *,
        tags(id, name, color)
      `)
      .single();

    if (error) {
      if (error.code === "23505") { // unique constraint violation
        return NextResponse.json(
          { success: false, error: "Tag already assigned to this image" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: imageTag });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to add tag to image" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const supabase = supabaseServer();
  
  try {
    const { searchParams } = new URL(req.url);
    const imageId = searchParams.get("imageId");
    const tagId = searchParams.get("tagId");

    if (!imageId || !tagId) {
      return NextResponse.json(
        { success: false, error: "Image ID and Tag ID are required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("image_tags")
      .delete()
      .eq("image_id", imageId)
      .eq("tag_id", tagId);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to remove tag from image" },
      { status: 500 }
    );
  }
}