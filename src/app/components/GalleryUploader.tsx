"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GalleryCard from "./GalleryCard";
import AnimatedCard from "./AnimatedCard";
import ModernGallery from "./ModernGallery";
import LinksManager from "./LinksManager";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function GalleryUploader() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState<"all" | "favorites">("all");
  const [design, setDesign] = useState<"classic" | "modern">("classic");
  const [showControls, setShowControls] = useState(false);
  const [activeTab, setActiveTab] = useState<"gallery" | "links">("gallery");

  // --- Infinite scroll infra
  const ioRef = useRef<IntersectionObserver | null>(null);
  const rootElRef = useRef<HTMLElement | null>(null); // current scroll root
  const sentinelElRef = useRef<HTMLElement | null>(null); // current sentinel
  const fetchingRef = useRef(false);

  // Recreate IO with the current root
  const createObserver = useCallback(
    (root: Element | Document | null) => {
      ioRef.current?.disconnect();
      ioRef.current = new IntersectionObserver(
        (entries) => {
          const e = entries[0];
          if (!e?.isIntersecting) return;
          if (fetchingRef.current) return;
          if (!hasMore) return;
          fetchingRef.current = true;
          setPage((p) => p + 1);
        },
        { root: (root as Element) ?? null, rootMargin: "320px", threshold: 0 }
      );
      // if we already have a sentinel mounted, observe it with the new IO
      if (sentinelElRef.current) {
        ioRef.current.observe(sentinelElRef.current);
      }
    },
    [hasMore]
  );

  // Root callback ref — called whenever the modern/classic root DOM node changes
  const setRootRef = useCallback(
    (node: HTMLDivElement | null) => {
      // In classic mode we use viewport root (null)
      const effectiveRoot =
        design === "modern" ? (node as Element | null) : null;

      rootElRef.current = node;
      createObserver(effectiveRoot);
    },
    [design, createObserver]
  );

  // Sentinel callback ref — unobserve old, observe new
  const setSentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (sentinelElRef.current && ioRef.current) {
      ioRef.current.unobserve(sentinelElRef.current);
    }
    sentinelElRef.current = node;
    if (node && ioRef.current) {
      ioRef.current.observe(node);
    }
  }, []);

  // Scroll fallback for modern: in case IO misses, detect near-bottom by scroll
  useEffect(() => {
    if (design !== "modern") return;

    let raf = 0;
    const el = rootElRef.current;
    if (!el) return;

    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!hasMore || fetchingRef.current) return;
        const pad = 400; // prefetch before bottom
        const nearBottom =
          el.scrollTop + el.clientHeight >= el.scrollHeight - pad;
        if (nearBottom) {
          fetchingRef.current = true;
          setPage((p) => p + 1);
        }
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll);
    };
  }, [design, hasMore]);

  // Reset observer when toggling design so it never “sticks”
  useEffect(() => {
    // Rebuild using the new root (callback ref will also run on next render)
    createObserver(
      design === "modern" ? (rootElRef.current as Element | null) : null
    );
    return () => {
      ioRef.current?.disconnect();
    };
  }, [design, createObserver]);

  // --- Data fetching
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/gallery?page=${page}&limit=${limit}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        const raw: Array<{
          id: string;
          title: string;
          encrypted_url?: string | null; // <-- NEW
          is_favorite?: boolean;
          links?: Array<{ url: string; password?: string }>;
        }> = Array.isArray(json?.data) ? json.data : [];

        const decrypted: GalleryItem[] = await Promise.all(
          raw.map(async (item) => {
            const title = await safeDecrypt(item.title);

            // IMPORTANT: image now comes from encrypted_url (signed URL to the .enc file)
            const imageUrl = item.encrypted_url
              ? await fetchAndDecrypt(item.encrypted_url) // downloads bytes, base64s, decrypts
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
              imageUrl, // <-- keep only decrypted URL here
              is_favorite: fav,
              isFavorite: fav,
              links,
            };
          })
        );

        if (!cancelled) {
          setItems((prev) => [...prev, ...decrypted]);
          setHasMore(raw.length === limit);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        if (!cancelled) setHasMore(false);
      } finally {
        if (!cancelled) {
          setLoading(false);
          fetchingRef.current = false;
        }
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [page, limit]);

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
              <div className="mb-4">
                <Tabs
                  value={activeTab}
                  onValueChange={(value) =>
                    setActiveTab(value as "gallery" | "links")
                  }
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="gallery">Gallery</TabsTrigger>
                    <TabsTrigger value="links">Links</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {activeTab === "gallery" && (
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
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main */}
      {activeTab === "gallery" ? (
        <>
          {design === "modern" ? (
            // IMPORTANT: this is the *scroll root*; the sentinel is inside it
            <div
              ref={setRootRef}
              className="w-full h-[calc(100vh-8rem)] overflow-auto"
            >
              <ModernGallery
                items={filteredItems}
                loading={loading}
                hasMore={hasMore}
                lastItemRef={noopLastItemRef}
              />
              {/* Sentinel lives inside the scrolling container */}
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
              // In classic, the viewport is the root (ref returns null; IO uses root=null)
              ref={setRootRef}
              className={`grid gap-4 w-full max-w-4xl px-2 mt-6 ${
                view === "grid" ? "grid-cols-2" : "grid-cols-1"
              }`}
            >
              {filteredItems.length > 0
                ? filteredItems.map((item, index) => (
                    <div key={item.id} className="w-full">
                      <AnimatedCard delay={(index % 2) * 0.1}>
                        <GalleryCard
                          id={item.id}
                          title={item.title}
                          imageUrl={item.imageUrl}
                          links={item.links}
                          isFavorite={item.is_favorite}
                          index={index}
                          showDevTitle={false}
                        />
                      </AnimatedCard>
                    </div>
                  ))
                : loading &&
                  Array.from({ length: view === "grid" ? 6 : 3 }).map(
                    (_, i) => <GalleryCardSkeleton key={`init-skeleton-${i}`} />
                  )}

              {loading &&
                filteredItems.length > 0 &&
                Array.from({ length: view === "grid" ? 4 : 2 }).map((_, i) => (
                  <GalleryCardSkeleton key={`scroll-skeleton-${i}`} />
                ))}

              {/* Sentinel — observed with root=null (viewport) */}
              <div ref={setSentinelRef} className="h-1" />
            </div>
          )}
        </>
      ) : (
        <div className="w-full max-w-4xl px-2 mt-6">
          <LinksManager />
        </div>
      )}

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
