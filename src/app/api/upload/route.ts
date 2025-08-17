export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { supabaseServer } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = supabaseServer();
    const { title, image, links } = await req.json();

    // Insert item
    const { data: item, error: itemError } = await supabase
      .from("gallery_items")
      .insert([{ title, image }])
      .select("id")
      .single();

    if (itemError || !item?.id) {
      console.error("Item insert failed:", itemError);
      return NextResponse.json(
        { error: "Failed to insert item" },
        { status: 500 }
      );
    }

    // Insert links
    if (links?.length) {
      const linkRows = links.map(
        (link: { url: string; password?: string }) => ({
          item_id: item.id,
          url: link.url,
          password: link.password ?? null,
        })
      );

      const { error: linksError } = await supabase
        .from("gallery_links")
        .insert(linkRows);

      if (linksError) {
        console.error("Links insert failed:", linksError);
        return NextResponse.json(
          { error: "Failed to insert links" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Upload API error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
