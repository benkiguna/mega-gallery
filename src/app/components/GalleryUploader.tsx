"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import GalleryCard from "./GalleryCard";
import AnimatedCard from "./AnimatedCard";
import { decryptText } from "@/lib/crypto-utils";
import { Input } from "@/components/ui/input";
import { Button } from "@guna/components/ui/button";

export default function GalleryUploader() {
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

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
            title: await decryptText(item.title),
            image: item.image ? await decryptText(item.image) : undefined,
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

  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full px-4 py-6 flex flex-col items-center bg-white dark:bg-black">
      <div className="sticky top-14 z-10 bg-white dark:bg-black border-b dark:border-gray-700 w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-3 py-4 px-2">
        <Input
          type="text"
          placeholder="Search by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
        <div className="flex gap-2 items-center justify-end max-w-4xl">
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
        </div>
      </div>

      <div
        className={`grid gap-4 w-full max-w-4xl px-2 mt-6 ${
          view === "grid" ? "grid-cols-2" : "grid-cols-1"
        }`}
      >
        {filteredItems.map((item, index) => {
          const isLast = index === filteredItems.length - 1;
          return (
            <div
              key={index}
              ref={isLast ? lastItemRef : null}
              className="w-full"
            >
              <AnimatedCard delay={(index % 2) * 0.1}>
                <GalleryCard
                  title={item.title}
                  imageUrl={item.image}
                  links={item.links}
                  index={index}
                  showDevTitle={false}
                />
              </AnimatedCard>
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="py-6 text-sm text-muted-foreground text-center">
          Loading more...
        </div>
      )}
    </div>
  );
}
