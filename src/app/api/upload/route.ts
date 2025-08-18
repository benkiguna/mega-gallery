// app/api/gallery/route.ts (POST)
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

const BUCKET = "gallery-encrypted";

function stripDataUrl(b64: string) {
  // Supports "data:xxx;base64,...." and plain base64
  const m = b64.match(/^data:[^;]+;base64,(.*)$/);
  return m ? m[1] : b64;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = supabaseServer();
    const { title, image, links } = await req.json();

    if (!title || !image) {
      return NextResponse.json(
        { error: "title and image are required" },
        { status: 400 }
      );
    }

    // 1) Create legacy row (keeps links table compatible)
    const { data: item, error: itemError } = await supabase
      .from("gallery_items")
      .insert([{ title /*, image: null (we no longer store blob here) */ }])
      .select("id")
      .single();

    if (itemError || !item?.id) {
      console.error("Item insert failed:", itemError);
      return NextResponse.json(
        { error: "Failed to insert item" },
        { status: 500 }
      );
    }
    const legacyId: string = item.id;

    // 2) Convert base64 -> bytes safely (no spread)
    const rawBase64 = stripDataUrl(image);
    let bytes: Uint8Array;
    try {
      bytes = Buffer.from(rawBase64, "base64");
      if (bytes.byteLength <= 12) {
        throw new Error("encrypted payload too short");
      }
    } catch (e) {
      console.error("Invalid base64 image:", e);
      return NextResponse.json(
        { error: "Invalid encrypted image" },
        { status: 400 }
      );
    }

    // 3) Upload to Storage as encrypted/<legacyId>.enc
    const path = `encrypted/${legacyId}.enc`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, {
        contentType: "application/octet-stream",
        upsert: false, // set true if you want to overwrite on retries
      });

    if (uploadError) {
      console.error("Storage upload failed:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // 4) Insert lightweight metadata row into gallery_files
    const { error: fileInsertError } = await supabase
      .from("gallery_files")
      .insert({
        legacy_id: legacyId,
        title,
        file_path: path,
        mime_type: "application/octet-stream",
        size_bytes: bytes.byteLength,
        is_favorite: false,
      });

    if (fileInsertError) {
      console.error("gallery_files insert failed:", fileInsertError);
      // Best effort cleanup: remove the uploaded object to avoid orphans
      await supabase.storage
        .from(BUCKET)
        .remove([path])
        .catch(() => {});
      return NextResponse.json(
        { error: "Failed to insert file metadata" },
        { status: 500 }
      );
    }

    // 5) Insert links referencing legacy_id (same as before)
    if (Array.isArray(links) && links.length) {
      const rows = links.map(
        (l: { url: string; password?: string; label?: string }) => ({
          item_id: legacyId,
          url: l.url,
          password: l.password ?? null,
          label: l.label ?? null,
        })
      );
      const { error: linksError } = await supabase
        .from("gallery_links")
        .insert(rows);
      if (linksError) {
        console.error("Links insert failed:", linksError);
        return NextResponse.json(
          { error: "Failed to insert links" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true, id: legacyId });
  } catch (err) {
    console.error("Upload API error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
