import { supabaseServer } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const supabase = supabaseServer();
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const offset = (page - 1) * limit;

  try {
    const { data: items, error } = await supabase
      .from("gallery_items")
      .select("id, title, image, created_at")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error || !items || items.length === 0) {
      return NextResponse.json(
        { success: true, data: [] },
        {
          status: 200,
          headers: {
            "Cache-Control":
              "public, max-age=172800, stale-while-revalidate=86400",
          },
        }
      );
    }

    const itemIds = items.map((item) => item.id);
    const chunkedLinks: any[] = [];

    for (let i = 0; i < itemIds.length; i += 30) {
      const chunk = itemIds.slice(i, i + 30);
      const { data: links, error: chunkError } = await supabase
        .from("gallery_links")
        .select("item_id, url, password, label")
        .in("item_id", chunk);

      if (chunkError) {
        console.error("Link chunk fetch error:", chunkError);
        return NextResponse.json(
          { success: false, data: [], error: chunkError.message },
          { status: 500 }
        );
      }

      chunkedLinks.push(...(links || []));
    }

    const itemsWithLinks = items.map((item) => ({
      title: item.title,
      image: item.image,
      links: chunkedLinks
        .filter((link) => link.item_id === item.id)
        .map((link) => ({ url: link.url, password: link.password })),
    }));

    return NextResponse.json(
      { success: true, data: itemsWithLinks },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "public, max-age=172800, stale-while-revalidate=86400",
        },
      }
    );
  } catch (err) {
    console.error("Unhandled error:", err);
    return NextResponse.json(
      { success: false, data: [], error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
