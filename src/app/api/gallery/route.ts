// app/api/gallery/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

// Keep dynamic since results change as signed URLs expire
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BUCKET = "gallery-encrypted";
const PAGE_SIZE_DEFAULT = 20;

/**
 * Pagination:
 * - Preferred: cursor-based via ?cursor=<lastId>&limit=20
 * - Back-compat: page/limit -> internally fetches by keyset
 */
export async function GET(req: NextRequest) {
  const supabase = supabaseServer();
  const { searchParams } = new URL(req.url);

  const limit = Math.min(
    parseInt(searchParams.get("limit") || String(PAGE_SIZE_DEFAULT), 10),
    100
  );
  const cursor = searchParams.get("cursor"); // expects last seen id (uuid as string)
  const page = parseInt(searchParams.get("page") || "1", 10); // legacy
  const usingLegacyPaging = !!searchParams.get("page");

  try {
    // -------- 1) Query new table with keyset pagination (by PK id) --------
    // Order newest-first for UI; use (id < cursor) to go back in time.
    let q = supabase
      .from("gallery_files")
      .select("id, legacy_id, title, file_path, is_favorite, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (cursor) {
      q = q.lt("id", cursor);
    } else if (usingLegacyPaging && page > 1) {
      // Legacy page -> simulate by stepping 'page-1' times in chunks of 'limit'
      // We do it efficiently by asking for only the boundary id each step.
      let lastId: string | null = null;
      for (let i = 1; i < page; i++) {
        const { data: boundary, error: boundaryErr } = await supabase
          .from("gallery_files")
          .select("id")
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (boundaryErr) throw boundaryErr;
        if (!boundary?.id) break;
        lastId = boundary.id;

        // Advance by (i * limit) using id-based skips
        const { data: step, error: stepErr } = await supabase
          .from("gallery_files")
          .select("id")
          .order("id", { ascending: false })
          .lt("id", lastId)
          .limit(i * limit);
        if (stepErr) throw stepErr;
        const last = step?.[step.length - 1]?.id;
        if (last) lastId = last;
      }
      if (lastId) q = q.lt("id", lastId);
    }

    const { data: files, error } = await q;
    if (error) {
      console.error("files query error:", error);
      return NextResponse.json(
        { success: false, data: [], error: error.message },
        { status: 500 }
      );
    }
    if (!files?.length) {
      return NextResponse.json({ success: true, data: [], nextCursor: null });
    }

    // -------- 2) Fetch links (join via legacy_id) in one shot --------
    const legacyIds = files.map((f) => f.legacy_id).filter(Boolean);
    const linksByLegacyId: Record<
      string,
      Array<{ url: string; password: string | null; label?: string | null }>
    > = {};

    if (legacyIds.length) {
      const { data: links, error: linksErr } = await supabase
        .from("gallery_links")
        .select("item_id, url, password, label")
        .in("item_id", legacyIds);

      if (linksErr) {
        console.error("links query error:", linksErr);
        return NextResponse.json(
          { success: false, data: [], error: linksErr.message },
          { status: 500 }
        );
      }

      for (const l of links || []) {
        const k = l.item_id as string;
        (linksByLegacyId[k] ||= []).push({
          url: l.url,
          password: l.password,
          label: l.label,
        });
      }
    }

    // -------- 3) Generate signed URLs for each encrypted file --------
    const signed = await Promise.all(
      files.map(async (row) => {
        const { data: signedUrl, error: signErr } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(row.file_path, 60 * 5); // 5 minutes
        if (signErr) {
          console.error("signed url error:", signErr);
        }
        return {
          id: row.id,
          title: row.title,
          is_favorite: row.is_favorite ?? false,
          created_at: row.created_at,
          // Use this URL on the client -> fetch -> decrypt
          encrypted_url: signedUrl?.signedUrl ?? null,
          links: linksByLegacyId[row.legacy_id] || [],
        };
      })
    );

    // Next cursor = smallest id in this (since we sorted desc)
    const nextCursor = files[files.length - 1]?.id ?? null;

    // Optional: caching headers (small metadata can be cached briefly)
    return NextResponse.json(
      { success: true, data: signed, nextCursor },
      {
        headers: {
          "Cache-Control":
            "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (err: unknown) {
    console.error("Unhandled error:", err);
    return NextResponse.json(
      { success: false, data: [], error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
