// app/api/gallery/route.ts (GET) — FIXED
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BUCKET = "gallery-encrypted";
const DEFAULT_LIMIT = 20;

function encodeCursor(
  c: { created_at: string; id: string } | null
): string | null {
  if (!c) return null;
  return Buffer.from(JSON.stringify(c)).toString("base64url");
}
function decodeCursor(
  s: string | null
): { created_at: string; id: string } | null {
  if (!s) return null;
  try {
    return JSON.parse(Buffer.from(s, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const supabase = supabaseServer();
  const { searchParams } = new URL(req.url);

  const limit = Math.min(
    parseInt(searchParams.get("limit") || `${DEFAULT_LIMIT}`, 10),
    100
  );
  const cursorParam = searchParams.get("cursor");
  const cursor = decodeCursor(cursorParam); // { created_at, id } | null

  let q = supabase
    .from("gallery_files")
    .select("id, legacy_id, title, file_path, is_favorite, created_at")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);

  if (cursor) {
    // IMPORTANT: pass RAW ISO strings; do NOT encodeURIComponent here.
    const c = cursor.created_at; // e.g., "2025-08-19T00:05:58.129602"
    const i = cursor.id;
    // Strictly older than the boundary:
    // (created_at < c) OR (created_at = c AND id < i)
    q = q.or(`and(created_at.lt.${c}),and(created_at.eq.${c},id.lt.${i})`);
  }

  const { data: files, error } = await q;
  if (error) {
    return NextResponse.json(
      { success: false, data: [], error: error.message },
      { status: 500 }
    );
  }
  if (!files?.length) {
    return NextResponse.json({ success: true, data: [], nextCursor: null });
  }

  // (optional) fetch links via legacy_id; omitted here for brevity…

  // Sign storage URLs
  const signed = await Promise.all(
    files.map(async (row) => {
      const { data: s } = await supabase.storage
        .from("gallery-encrypted")
        .createSignedUrl(row.file_path, 60 * 5);
      return {
        id: row.id,
        title: row.title,
        is_favorite: row.is_favorite ?? false,
        created_at: row.created_at,
        encrypted_url: s?.signedUrl ?? null,
        links: [], // add your links mapping if needed
      };
    })
  );

  const last = files[files.length - 1];
  const nextCursor = encodeCursor({ created_at: last.created_at, id: last.id });

  return NextResponse.json({ success: true, data: signed, nextCursor });
}
