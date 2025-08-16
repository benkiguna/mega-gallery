"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GalleryCard from "./GalleryCard";
import AnimatedCard from "./AnimatedCard";
import ModernGallery from "./ModernGallery";
import LinksManager from "./LinksManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { decryptText } from "@/lib/crypto-utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import GalleryCardSkeleton from "./GalleryCardSkeleton";

export default function GalleryUploader() {
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState<"all" | "favorites">("all");
  const [design, setDesign] = useState<"classic" | "modern">("classic");
  const [showControls, setShowControls] = useState(true);
  const [activeTab, setActiveTab] = useState<"gallery" | "links">("gallery");

  const observer = useRef<IntersectionObserver | null>(null);
  const lastItemRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/gallery?page=${page}&limit=10`);
        const json = await res.json();

        if (!json?.data || !Array.isArray(json.data)) {
          console.warn("Invalid API response:", json);
          return;
        }

        const decrypted = await Promise.all(
          json.data.map(async (item: any) => ({
            id: item.id,
            title: await decryptText(item.title),
            image: item.image ? await decryptText(item.image) : undefined,
            imageUrl: item.image ? await decryptText(item.image) : undefined, // Add this for ModernGallery
            is_favorite: item.is_favorite ?? false,
            isFavorite: item.is_favorite ?? false, // Add this for ModernGallery
            links: await Promise.all(
              item.links.map(async (link: any) => ({
                url: await decryptText(link.url),
                password: link.password
                  ? await decryptText(link.password)
                  : undefined,
              }))
            ),
          }))
        );
        setItems((prev) => [...prev, ...decrypted]);
        setHasMore(json.data.length > 0);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page]);

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFavorite =
      filter === "favorites" ? item.is_favorite === true : true;
    return matchesSearch && matchesFavorite;
  });

  // Debug logging
  console.log('GalleryUploader state:', {
    items: items.length,
    filteredItems: filteredItems.length,
    design,
    loading,
    hasMore
  });
  console.log('Sample item:', filteredItems[0]);

  return (
    <div className="w-full flex flex-col items-center">
      <div className={`sticky top-14 z-10 bg-white dark:bg-black border-b dark:border-gray-700 w-full ${design === "modern" ? "max-w-none" : "max-w-4xl"}`}>
        {/* Controls Toggle Button */}
        <div className="flex items-center justify-between p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowControls(!showControls)}
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

        {/* Collapsible Controls */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-2 pb-4"
            >
              {/* Main Tabs */}
              <div className="mb-4">
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "gallery" | "links")} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="gallery">Gallery</TabsTrigger>
                    <TabsTrigger value="links">Links</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Gallery-specific controls (only show when gallery tab is active) */}
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
                        setFilter((prev) => (prev === "favorites" ? "all" : "favorites"))
                      }
                    >
                      {filter === "favorites" ? "Showing Favorites" : "Show Favorites"}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content Area */}
      {activeTab === "gallery" ? (
        <>
          {design === "modern" ? (
            <div className="w-full h-[calc(100vh-8rem)]">
              <ModernGallery 
                items={filteredItems}
                loading={loading}
                hasMore={hasMore}
                lastItemRef={lastItemRef}
              />
            </div>
          ) : (
            <div
              className={`grid gap-4 w-full max-w-4xl px-2 mt-6 ${
                view === "grid" ? "grid-cols-2" : "grid-cols-1"
              }`}
            >
              {filteredItems.length > 0
                ? filteredItems.map((item, index) => {
                    console.log(item);
                    const preloadOffset = 4;
                    const isTrigger =
                      index === filteredItems.length - preloadOffset &&
                      filteredItems.length >= preloadOffset;

                    return (
                      <div
                        key={index}
                        ref={isTrigger ? lastItemRef : null}
                        className="w-full"
                      >
                        <AnimatedCard delay={(index % 2) * 0.1}>
                          <GalleryCard
                            id={item.id}
                            title={item.title}
                            imageUrl={item.image}
                            links={item.links}
                            isFavorite={item.is_favorite}
                            index={index}
                            showDevTitle={false}
                          />
                        </AnimatedCard>
                      </div>
                    );
                  })
                : loading &&
                  Array.from({ length: view === "grid" ? 6 : 3 }).map((_, i) => (
                    <GalleryCardSkeleton key={`init-skeleton-${i}`} />
                  ))}
              {loading &&
                filteredItems.length > 0 &&
                Array.from({ length: view === "grid" ? 4 : 2 }).map((_, i) => (
                  <GalleryCardSkeleton key={`scroll-skeleton-${i}`} />
                ))}
            </div>
          )}
        </>
      ) : (
        <div className="w-full max-w-4xl px-2 mt-6">
          <LinksManager />
        </div>
      )}

      {loading && filteredItems.length === 0 && (
        <div className="py-12 text-sm text-muted-foreground text-center">
          Loading gallery...
        </div>
      )}
    </div>
  );
}
