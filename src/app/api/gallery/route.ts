// app/api/gallery/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import type { PostgrestError } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BUCKET = "gallery-encrypted";
const DEFAULT_LIMIT = 20;

interface FileRow {
  id: string;
  legacy_id: string | null;
  title: string | null;
  file_path: string;
  is_favorite: boolean | null;
  created_at: string; // ISO timestamp
}

interface LinkRow {
  item_id: string;
  url: string;
  password: string | null;
  label?: string | null;
}

type SupabaseStorageError = {
  message: string;
  statusCode?: string | number;
};

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
  const cursor = decodeCursor(cursorParam);
  
  // Get tag filter parameter
  const tagFilters = searchParams.get("tags");
  const tagIds = tagFilters ? tagFilters.split(",").filter(Boolean) : [];

  // 1) Page of files: newest first, stable tiebreaker
  let q = supabase
    .from("gallery_files")
    .select("id, legacy_id, title, file_path, is_favorite, created_at")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);

  // Apply tag filtering if tags are specified
  if (tagIds.length > 0) {
    // Get image IDs that have any of the specified tags
    const { data: imageIds } = await supabase
      .from("image_tags")
      .select("image_id")
      .in("tag_id", tagIds);
    
    const filteredImageIds = imageIds?.map(row => row.image_id) || [];
    if (filteredImageIds.length > 0) {
      q = q.in("id", filteredImageIds);
    } else {
      // No images found with these tags, return empty result
      return NextResponse.json({ success: true, data: [], nextCursor: null });
    }
  }

  if (cursor) {
    const c = cursor.created_at; // RAW ISO string (no encodeURIComponent)
    const i = cursor.id;
    // Strictly older than boundary:
    // (created_at < c) OR (created_at = c AND id < i)
    q = q.or(`and(created_at.lt.${c}),and(created_at.eq.${c},id.lt.${i})`);
  }

  const { data: files, error: filesErr } = await q.returns<FileRow[]>();
  if (filesErr) {
    return NextResponse.json(
      { success: false, data: [], error: (filesErr as PostgrestError).message },
      { status: 500 }
    );
  }
  if (!files || files.length === 0) {
    return NextResponse.json({ success: true, data: [], nextCursor: null });
  }

  // 2) Batch fetch links for these files via legacy_id
  const legacyIds = files
    .map((f) => f.legacy_id)
    .filter((v): v is string => Boolean(v));

  const linksByLegacyId: Record<string, LinkRow[]> = {};
  if (legacyIds.length) {
    const chunkSize = 1000;
    for (let i = 0; i < legacyIds.length; i += chunkSize) {
      const chunk = legacyIds.slice(i, i + chunkSize);
      const { data: linksChunk, error: linksErr } = await supabase
        .from("gallery_links")
        .select("item_id, url, password, label")
        .in("item_id", chunk)
        .returns<LinkRow[]>();

      if (linksErr) {
        return NextResponse.json(
          {
            success: false,
            data: [],
            error: (linksErr as PostgrestError).message,
          },
          { status: 500 }
        );
      }

      for (const l of linksChunk ?? []) {
        (linksByLegacyId[l.item_id] ||= []).push(l);
      }
    }
  }

  // 3) Batch fetch tags for these files
  const fileIds = files.map((f) => f.id);
  const tagsByFileId: Record<string, { id: string; name: string; color: string }[]> = {};
  
  if (fileIds.length) {
    const { data: imageTags, error: tagsErr } = await supabase
      .from("image_tags")
      .select(`
        image_id,
        tags(id, name, color)
      `)
      .in("image_id", fileIds);

    if (tagsErr) {
      return NextResponse.json(
        {
          success: false,
          data: [],
          error: (tagsErr as PostgrestError).message,
        },
        { status: 500 }
      );
    }

    for (const imageTag of imageTags ?? []) {
      if (imageTag.tags) {
        const tag = imageTag.tags as unknown as { id: string; name: string; color: string };
        (tagsByFileId[imageTag.image_id] ||= []).push(tag);
      }
    }
  }

  // 4) Sign storage URLs and attach links and tags
  const signed = await Promise.all(
    files.map(async (row) => {
      const { data: s, error: signErr } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(row.file_path, 60 * 5);

      if (signErr) {
        const e = signErr as SupabaseStorageError;
        // Log and continue (client can handle null URL)
        console.error("sign url error:", row.file_path, e.message);
      }

      return {
        id: row.id,
        title: row.title,
        is_favorite: row.is_favorite ?? false,
        created_at: row.created_at,
        encrypted_url: s?.signedUrl ?? null,
        // NOTE: url/password are still encrypted; client decrypts them
        links: linksByLegacyId[row.legacy_id ?? ""] ?? [],
        tags: tagsByFileId[row.id] ?? [],
      };
    })
  );

  // 5) Next cursor = last row of this page (created_at, id)
  const last = files[files.length - 1];
  const nextCursor = encodeCursor({ created_at: last.created_at, id: last.id });

  return NextResponse.json({ success: true, data: signed, nextCursor });
}
