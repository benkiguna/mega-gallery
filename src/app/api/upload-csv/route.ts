export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { supabaseServer } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = supabaseServer();
  try {
    const body = await req.json();
    const rows = body.rows as Record<string, string>[];

    let insertedCount = 0;

    for (const row of rows) {
      const { title, image, url, url1, url2 } = row;

      if (!row.title || !row.url) {
        console.warn("Skipping due to missing title or url:", row);
        continue;
      }
      // Insert gallery item (even if fields are encrypted)
      const insertItem = await supabase
        .from("gallery_items")
        .insert({ title, image })
        .select("*");

      if (
        insertItem.error ||
        !insertItem.data ||
        insertItem.data.length === 0
      ) {
        console.warn("Item insert failed:", {
          error: insertItem.error,
          row,
          insertPayload: { title, image },
        });
        continue;
      }

      const item = insertItem.data[0];

      // Insert related links (skip empty encrypted values safely)
      const links = [
        { label: "url", url: url, password: null },
        { label: "url1", url: url1, password: row.password1 },
        { label: "url2", url: url2, password: row.password2 },
      ]
        .filter(
          (link) => typeof link.url === "string" && link.url.trim() !== ""
        )
        .map((link) => ({
          item_id: item.id,
          url: link.url,
          password: link.password || null,
          label: link.label,
        }));

      if (links.length) {
        await supabase.from("gallery_links").insert(links);
      }

      insertedCount++;
    }

    return NextResponse.json({ success: true, count: insertedCount });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
