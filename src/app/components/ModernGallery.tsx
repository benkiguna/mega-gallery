"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Copy, Heart, HeartOff } from "lucide-react";

type LinkItem = {
  url: string;
  password?: string;
};

type GalleryItem = {
  id: string;
  title: string;
  imageUrl?: string;
  links: LinkItem[];
  isFavorite: boolean;
};

type ModernGalleryProps = {
  items: GalleryItem[];
  loading: boolean;
  hasMore: boolean;
  lastItemRef: (node: HTMLDivElement) => void;
};

export default function ModernGallery({
  items,
  loading,
  hasMore,
  lastItemRef,
}: ModernGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showLinks, setShowLinks] = useState(false);
  const thumbnailRef = useRef<HTMLDivElement>(null); // Initialize ModernGallery component
  // console.log('ModernGallery rendered with:', { items: items.length, loading, hasMore });

  // Auto-center the active image when items change
  useEffect(() => {
    if (items.length > 0 && activeIndex >= items.length) {
      setActiveIndex(Math.floor(items.length / 2));
    }
  }, [items.length, activeIndex]);

  // Scroll to center the active thumbnail in the pivot viewport
  const scrollToPivot = useCallback((index: number) => {
    if (!thumbnailRef.current) return;

    const container = thumbnailRef.current;
    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.width / 2;

    const targetChild = container.children[index] as HTMLElement;
    if (!targetChild) return;

    const targetRect = targetChild.getBoundingClientRect();
    const targetCenter = targetRect.width / 2;

    const scrollLeft = targetChild.offsetLeft - containerCenter + targetCenter;

    container.scrollTo({
      left: scrollLeft,
      behavior: "smooth",
    });
  }, []);

  const navigateImage = useCallback(
    (direction: "prev" | "next") => {
      if (direction === "prev" && activeIndex > 0) {
        const newIndex = activeIndex - 1;
        setActiveIndex(newIndex);
        scrollToPivot(newIndex);
      } else if (direction === "next" && activeIndex < items.length - 1) {
        const newIndex = activeIndex + 1;
        setActiveIndex(newIndex);
        scrollToPivot(newIndex);
      }
    },
    [activeIndex, items.length, scrollToPivot]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        navigateImage("prev");
      } else if (e.key === "ArrowRight") {
        navigateImage("next");
      } else if (e.key === "Escape") {
        setShowLinks(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigateImage]);

  const handleCopy = async (password: string, index: number) => {
    try {
      await navigator.clipboard.writeText(password);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const toggleFavorite = async (
    e: React.MouseEvent,
    itemId: string,
    currentFavorite: boolean
  ) => {
    e.stopPropagation();
    const newFavorite = !currentFavorite;

    await fetch("/api/gallery/favorite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, isFavorite: newFavorite }),
    });
  };

  // Pivot-based scroll handling - optimized for performance
  const handleThumbnailScroll = useCallback(() => {
    if (!thumbnailRef.current) return;

    const container = thumbnailRef.current;
    const containerRect = container.getBoundingClientRect();

    // Calculate the center of the visible container (pivot point)
    const containerCenter = containerRect.left + containerRect.width / 2;

    // Find which thumbnail is closest to the center (pivot point)
    let closestIndex = 0;
    let minDistance = Infinity;

    // Use more efficient iteration
    const children = container.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      const childRect = child.getBoundingClientRect();
      const childCenter = childRect.left + childRect.width / 2;
      const distance = Math.abs(childCenter - containerCenter);

      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }

    // Update active index if it changed - immediate update
    if (closestIndex !== activeIndex && closestIndex < items.length) {
      setActiveIndex(closestIndex);
    }
  }, [activeIndex, items.length]);

  // Handle thumbnail click with pivot centering
  const handleThumbnailClick = useCallback(
    (index: number) => {
      setActiveIndex(index);
      scrollToPivot(index);
    },
    [scrollToPivot]
  );

  // Add scroll event listener for pivot detection and infinite scroll
  useEffect(() => {
    const container = thumbnailRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      // Use requestAnimationFrame for smooth, crisp pivot updates
      requestAnimationFrame(() => {
        handleThumbnailScroll();
      });

      // Check for infinite scroll when near the end
      const scrollLeft = container.scrollLeft;
      const scrollWidth = container.scrollWidth;
      const clientWidth = container.clientWidth;
      const scrollPosition = scrollLeft + clientWidth;
      const scrollThreshold = scrollWidth - 100; // 100px threshold

      if (scrollPosition >= scrollThreshold && hasMore && !loading) {
        console.log("Infinite scroll triggered:", {
          scrollLeft,
          scrollWidth,
          clientWidth,
          scrollPosition,
          scrollThreshold,
        });
        // Trigger infinite scroll
        if (lastItemRef) {
          // Create a dummy element to trigger the intersection observer
          const dummyElement = document.createElement("div");
          lastItemRef(dummyElement);
        }
      }

      // Debounce the scrolling state
      clearTimeout(scrollTimeout);

      scrollTimeout = setTimeout(() => {
        // Scroll state debounced
      }, 16); // ~60fps for smooth state updates
    };

    container.addEventListener("scroll", handleScroll);

    // Initial pivot calculation
    setTimeout(() => handleThumbnailScroll(), 50);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [handleThumbnailScroll, hasMore, loading, lastItemRef]);

  if (loading && items.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-lg font-medium mb-2">Loading gallery...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mt-4"></div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-lg font-medium mb-2">No images found</div>
          <div className="text-sm">
            Try adjusting your search or filter settings
          </div>
          <div className="text-xs mt-2">Items count: {items.length}</div>
        </div>
      </div>
    );
  }

  const activeItem = items[activeIndex];

  // Get the active item to display
  // console.log('ModernGallery activeItem:', activeItem);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Main Gallery Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top Row - Active Image with Background Cover Art */}
        <div className="flex-1 relative rounded-lg overflow-hidden border dark:border-gray-700 mb-4 mx-4">
          {/* Background Image as Cover Art */}
          {activeItem.imageUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(${activeItem.imageUrl})`,
                filter: "blur(8px) brightness(1)",
              }}
            />
          )}

          {/* Dark Overlay for Better Text Readability */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Favorite Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) =>
              toggleFavorite(e, activeItem.id, activeItem.isFavorite)
            }
            className="absolute top-4 left-4 z-20 bg-white/80 dark:bg-black/80 hover:bg-white dark:hover:bg-black backdrop-blur-sm"
          >
            {activeItem.isFavorite ? (
              <Heart className="text-red-500 fill-red-500 w-5 h-5" />
            ) : (
              <HeartOff className="text-gray-400 w-5 h-5" />
            )}
          </Button>

          {/* Main Image Overlay */}
          <div className="relative z-10 w-full h-full flex items-center justify-center p-8">
            {activeItem.imageUrl ? (
              <img
                src={activeItem.imageUrl}
                alt={activeItem.title}
                className="max-w-full max-h-full object-contain rounded-lg"
                style={{
                  filter:
                    "drop-shadow(0 0 30px rgba(255,255,255,0.3)) drop-shadow(0 0 60px rgba(255,255,255,0.2))",
                  boxShadow:
                    "0 0 40px rgba(255,255,255,0.4), inset 0 0 20px rgba(255,255,255,0.1)",
                }}
              />
            ) : (
              <div className="text-center text-gray-300">
                <div className="text-2xl font-medium mb-2">
                  {activeItem.title}
                </div>
                <div className="text-sm">No image available</div>
              </div>
            )}
          </div>

          {/* Image Info and Actions */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
            <div className="flex flex-col items-center text-center">
              <div className="text-white mb-3">
                <h3 className="text-xl font-semibold mb-1">
                  {activeItem.title}
                </h3>
                <p className="text-sm text-gray-300">
                  {activeIndex + 1} of {items.length}
                </p>
              </div>

              {activeItem.links.length === 1 ? (
                <Button
                  onClick={() => window.open(activeItem.links[0].url, "_blank")}
                  variant="outline"
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30 px-6"
                >
                  View
                </Button>
              ) : (
                activeItem.links.length > 1 && (
                  <Button
                    onClick={() => setShowLinks(!showLinks)}
                    variant="outline"
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30 px-6"
                  >
                    {showLinks ? "Hide Links" : "Show Links"}
                  </Button>
                )
              )}
            </div>

            {/* Links Panel */}
            <AnimatePresence>
              {showLinks && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-4"
                >
                  <div className="grid gap-3">
                    {activeItem.links.map((link, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(link.url, "_blank")}
                          className="bg-white/20 border-white/30 text-white hover:bg-white/30 flex-1 justify-start"
                        >
                          Visit Link {index + 1}
                        </Button>
                        {link.password && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(link.password!, index)}
                            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                          >
                            {copiedIndex === index ? (
                              "Copied!"
                            ) : (
                              <>
                                <Copy size={14} className="mr-1" />
                                Copy Password
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom Row - Pivot-based Thumbnail Carousel */}
        <div className="h-32 mx-4 mb-4">
          {/* Pivot Viewport Container */}
          <div className="relative">
            {/* Thumbnail Scroll Container */}
            <div
              ref={thumbnailRef}
              className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 px-12"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex-shrink-0 cursor-pointer transition-all duration-200 ${
                    index === activeIndex
                      ? "scale-110 shadow-lg shadow-blue-500/30"
                      : "hover:scale-105"
                  }`}
                  onClick={() => handleThumbnailClick(index)}
                  data-index={index}
                >
                  <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 text-center p-2">
                        {item.title}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-center mt-1 text-gray-600 dark:text-gray-400 truncate max-w-24">
                    {item.title}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {loading && hasMore && (
                <div className="flex-shrink-0 w-24 h-24 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
