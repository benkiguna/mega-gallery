"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GalleryCard from "./GalleryCard";
import AnimatedCard from "./AnimatedCard";
import ModernGallery from "./ModernGallery";
import { decryptText, fetchAndDecrypt } from "@/lib/crypto-utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import GalleryCardSkeleton from "./GalleryCardSkeleton";

type GalleryItem = {
  id: string;
  title: string;
  imageUrl?: string;
  is_favorite: boolean;
  isFavorite: boolean;
  links: Array<{ url: string; password?: string }>;
};

type ApiItem = {
  id: string;
  title: string;
  encrypted_url?: string | null;
  is_favorite?: boolean;
  links?: Array<{ url: string; password?: string }>;
};

// ----- decrypt cache (module scope) -----
const decryptedCache = new Map<string, Promise<string>>();
function getDecryptedOnce(key: string, work: () => Promise<string>) {
  if (!decryptedCache.has(key)) {
    decryptedCache.set(
      key,
      work().catch((e) => {
        decryptedCache.delete(key); // allow retry on failure
        throw e;
      })
    );
  }
  return decryptedCache.get(key)!;
}
// ----------------------------------------

export default function GalleryUploader() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState<"all" | "favorites">("all");
  const [design, setDesign] = useState<"classic" | "modern">("classic");
  const [showControls, setShowControls] = useState(false);

  // NEW: which cards are “flipped” to show the links panel
  const [flipped, setFlipped] = useState<Set<string>>(new Set());

  // --- Infinite scroll infra
  const ioRef = useRef<IntersectionObserver | null>(null);
  const rootElRef = useRef<HTMLElement | null>(null);
  const sentinelElRef = useRef<HTMLElement | null>(null);
  const fetchingRef = useRef(false);
  const didInitRef = useRef(false);

  // Fetch a page using cursor
  const fetchMore = useCallback(async () => {
    if (fetchingRef.current || !hasMore) return;
    fetchingRef.current = true;
    setLoading(true);

    try {
      const url = new URL("/api/gallery", window.location.origin);
      url.searchParams.set("limit", String(limit));
      if (cursor) url.searchParams.set("cursor", cursor);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      const raw: ApiItem[] = Array.isArray(json?.data) ? json.data : [];

      const decrypted: GalleryItem[] = await Promise.all(
        raw.map(async (item) => {
          const title = await safeDecrypt(item.title);
          const imageUrl = item.encrypted_url
            ? await getDecryptedOnce(item.id, () =>
                fetchAndDecrypt(item.encrypted_url!)
              )
            : undefined;

          const rawLinks = Array.isArray(item.links) ? item.links : [];
          const links = await Promise.all(
            rawLinks.map(async (link) => ({
              url: await safeDecrypt(link.url),
              password: link.password
                ? await safeDecrypt(link.password)
                : undefined,
            }))
          );

          const fav = item.is_favorite ?? false;
          return {
            id: item.id,
            title,
            imageUrl,
            is_favorite: fav,
            isFavorite: fav,
            links,
          };
        })
      );

      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const deduped = decrypted.filter((d) => !seen.has(d.id));
        return deduped.length ? [...prev, ...deduped] : prev;
      });

      const nextCursor: string | null = json?.nextCursor ?? null;
      setCursor(nextCursor);
      setHasMore(nextCursor ? true : raw.length === limit);
    } catch (err) {
      console.error("Fetch error:", err);
      setHasMore(false);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [cursor, limit, hasMore]);

  // NEW: click behavior for a card
  const handleItemClick = useCallback((item: GalleryItem) => {
    console.log("Item clicked:", item);
    const count = item.links?.length ?? 0;
    if (count === 1) {
      const href = item.links[0].url;
      try {
        // Prefer new tab; noopener for safety
        window.open(href, "_blank", "noopener,noreferrer");
      } catch {
        location.href = href;
      }
      return;
    }
    if (count > 1) {
      setFlipped((prev) => {
        const next = new Set(prev);
        if (next.has(item.id)) next.delete(item.id);
        else next.add(item.id);
        return next;
      });
    }
  }, []);

  // Recreate IO with the current root
  const createObserver = useCallback(
    (root: Element | Document | null) => {
      ioRef.current?.disconnect();
      ioRef.current = new IntersectionObserver(
        (entries) => {
          const e = entries[0];
          if (!e?.isIntersecting) return;
          if (fetchingRef.current || !hasMore) return;
          fetchMore();
        },
        { root: (root as Element) ?? null, rootMargin: "320px", threshold: 0 }
      );
      if (sentinelElRef.current) {
        ioRef.current.observe(sentinelElRef.current);
      }
    },
    [hasMore, fetchMore]
  );

  const setRootRef = useCallback(
    (node: HTMLDivElement | null) => {
      const effectiveRoot =
        design === "modern" ? (node as Element | null) : null;
      rootElRef.current = node;
      createObserver(effectiveRoot);
    },
    [design, createObserver]
  );

  const setSentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (sentinelElRef.current && ioRef.current) {
      ioRef.current.unobserve(sentinelElRef.current);
    }
    sentinelElRef.current = node;
    if (node && ioRef.current) {
      ioRef.current.observe(node);
    }
  }, []);

  // Scroll fallback for modern
  useEffect(() => {
    if (design !== "modern") return;
    let raf = 0;
    const el = rootElRef.current;
    if (!el) return;

    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!hasMore || fetchingRef.current) return;
        const pad = 400;
        const nearBottom =
          el.scrollTop + el.clientHeight >= el.scrollHeight - pad;
        if (!ioRef.current && nearBottom) fetchMore();
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll);
    };
  }, [design, hasMore, fetchMore]);

  useEffect(() => {
    createObserver(
      design === "modern" ? (rootElRef.current as Element | null) : null
    );
    return () => {
      ioRef.current?.disconnect();
    };
  }, [design, createObserver]);

  // Initial load
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    fetchMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtered view
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFavorite = filter === "favorites" ? item.is_favorite : true;
    return matchesSearch && matchesFavorite;
  });

  // Keep ModernGallery prop compat if it expects lastItemRef
  const noopLastItemRef = useCallback((_node: HTMLDivElement | null) => {}, []);

  return (
    <div className="w-full flex flex-col items-center">
      <div
        className={`sticky top-14 z-10 bg-white dark:bg-black border-b dark:border-gray-700 w-full ${
          design === "modern" ? "max-w-none" : "max-w-4xl"
        }`}
      >
        {/* Controls */}
        <div className="flex items-center justify-between p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowControls((s) => !s)}
            className="text-sm"
          >
            {showControls ? "Hide Controls" : "Show Controls"}
          </Button>
          <div className="flex gap-2 items-center">
            <Button
              variant={design === "classic" ? "default" : "outline"}
              size="sm"
              onClick={() => setDesign("classic")}
            >
              Classic
            </Button>
            <Button
              variant={design === "modern" ? "default" : "outline"}
              size="sm"
              onClick={() => setDesign("modern")}
            >
              Modern
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-2 pb-4"
            >
              
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <Input
                    type="text"
                    placeholder="Search by title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                  <div className="flex gap-2 items-center justify-end">
                    {design === "classic" && (
                      <>
                        <Button
                          variant={view === "grid" ? "outline" : "default"}
                          size="sm"
                          onClick={() => setView("grid")}
                        >
                          Grid
                        </Button>
                        <Button
                          variant={view === "list" ? "outline" : "default"}
                          size="sm"
                          onClick={() => setView("list")}
                        >
                          List
                        </Button>
                      </>
                    )}
                    <Button
                      variant={filter === "favorites" ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setFilter((prev) =>
                          prev === "favorites" ? "all" : "favorites"
                        )
                      }
                    >
                      {filter === "favorites"
                        ? "Showing Favorites"
                        : "Show Favorites"}
                    </Button>
                  </div>
                </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main */}
      <>
          {design === "modern" ? (
            // Modern: if you want the same click behavior here,
            // pass an onItemClick prop and implement it inside ModernGallery.
            <div
              ref={setRootRef}
              className="w-full h-[calc(100vh-8rem)] overflow-auto"
            >
              <ModernGallery
                items={filteredItems}
                loading={loading}
                hasMore={hasMore}
                lastItemRef={noopLastItemRef}
                onLoadMore={fetchMore}
              />
              <div ref={setSentinelRef} className="h-1" />
              {loading && filteredItems.length === 0 && (
                <div className="p-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <GalleryCardSkeleton key={`modern-init-skeleton-${i}`} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div
              ref={setRootRef}
              className={`grid gap-4 w-full max-w-4xl px-2 mt-6 ${
                view === "grid" ? "grid-cols-2" : "grid-cols-1"
              }`}
            >
              {filteredItems.length > 0
                ? filteredItems.map((item, index) => {
                    const isFlipped = flipped.has(item.id);
                    return (
                      <div key={item.id} className="w-full">
                        <AnimatedCard delay={(index % 2) * 0.1}>
                          {/* CLICK TARGET */}
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => handleItemClick(item)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleItemClick(item);
                              }
                            }}
                            className="cursor-pointer"
                          >
                            <GalleryCard
                              id={item.id}
                              title={item.title}
                              imageUrl={item.imageUrl}
                              links={item.links}
                              isFavorite={item.is_favorite}
                              index={index}
                              showDevTitle={false}
                            />
                          </div>

                          {/* FLIP PANEL: shows all links when multiple */}
                          {isFlipped && item.links.length > 1 && (
                            <div className="mt-2 rounded-xl border p-3 text-sm bg-muted/30">
                              <div className="mb-2 font-medium">Links</div>
                              <ul className="space-y-1">
                                {item.links.map((l, i) => (
                                  <li key={`${item.id}-link-${i}`}>
                                    <a
                                      href={l.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="underline hover:no-underline break-all"
                                      onClick={(e) => e.stopPropagation()} // don't bubble to card
                                    >
                                      {l.url}
                                    </a>
                                    {l.password && (
                                      <span className="ml-2 text-xs text-muted-foreground">
                                        (password: {l.password})
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </AnimatedCard>
                      </div>
                    );
                  })
                : loading &&
                  Array.from({ length: view === "grid" ? 6 : 3 }).map(
                    (_, i) => <GalleryCardSkeleton key={`init-skeleton-${i}`} />
                  )}

              {loading &&
                filteredItems.length > 0 &&
                Array.from({ length: view === "grid" ? 4 : 2 }).map((_, i) => (
                  <GalleryCardSkeleton key={`scroll-skeleton-${i}`} />
                ))}

              <div ref={setSentinelRef} className="h-1" />
            </div>
          )}
      </>

      {loading && filteredItems.length === 0 && design !== "modern" && (
        <div className="py-12 text-sm text-muted-foreground text-center">
          Loading gallery...
        </div>
      )}
    </div>
  );
}

/** Safe decrypt wrapper so a single bad field doesn’t crash the page */
async function safeDecrypt(value?: string): Promise<string> {
  try {
    return value ? await decryptText(value) : "";
  } catch (e) {
    console.warn("Decrypt failed for value:", value, e);
    return value ?? "";
  }
}
