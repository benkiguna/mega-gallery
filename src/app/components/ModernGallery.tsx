"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Copy, Heart, HeartOff, ChevronLeft, ChevronRight } from "lucide-react";

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
  lastItemRef
}: ModernGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showLinks, setShowLinks] = useState(false);
  const thumbnailRef = useRef<HTMLDivElement>(null);

  // Debug logging
  console.log('ModernGallery rendered with:', { items: items.length, loading, hasMore });
  console.log('ModernGallery items:', items);

  // Auto-center the active image when items change
  useEffect(() => {
    if (items.length > 0 && activeIndex >= items.length) {
      setActiveIndex(Math.floor(items.length / 2));
    }
  }, [items.length, activeIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        navigateImage('prev');
      } else if (e.key === 'ArrowRight') {
        navigateImage('next');
      } else if (e.key === 'Escape') {
        setShowLinks(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, items.length]);

  const handleCopy = async (password: string, index: number) => {
    try {
      await navigator.clipboard.writeText(password);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const toggleFavorite = async (e: React.MouseEvent, itemId: string, currentFavorite: boolean) => {
    e.stopPropagation();
    const newFavorite = !currentFavorite;

    await fetch("/api/gallery/favorite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, isFavorite: newFavorite }),
    });
  };

  const scrollToThumbnail = (index: number) => {
    if (thumbnailRef.current) {
      const thumbnail = thumbnailRef.current.children[index] as HTMLElement;
      if (thumbnail) {
        thumbnail.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && activeIndex > 0) {
      const newIndex = activeIndex - 1;
      setActiveIndex(newIndex);
      scrollToThumbnail(newIndex);
    } else if (direction === 'next' && activeIndex < items.length - 1) {
      const newIndex = activeIndex + 1;
      setActiveIndex(newIndex);
      scrollToThumbnail(newIndex);
    }
  };

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
          <div className="text-sm">Try adjusting your search or filter settings</div>
          <div className="text-xs mt-2">Items count: {items.length}</div>
        </div>
      </div>
    );
  }

  const activeItem = items[activeIndex];
  
  // Debug logging for activeItem
  console.log('ModernGallery activeItem:', activeItem);

  return (
    <div className="w-full h-full flex flex-col">

      {/* Main Gallery Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top Row - Active Image */}
        <div className="flex-1 relative bg-white dark:bg-black rounded-lg overflow-hidden border dark:border-gray-700 mb-4 mx-4">
          {/* Navigation Arrows */}
          {items.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateImage('prev')}
                disabled={activeIndex === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 dark:bg-black/80 hover:bg-white dark:hover:bg-black backdrop-blur-sm"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateImage('next')}
                disabled={activeIndex === items.length - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 dark:bg-black/80 hover:bg-white dark:hover:bg-black backdrop-blur-sm"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </>
          )}

          {/* Favorite Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => toggleFavorite(e, activeItem.id, activeItem.isFavorite)}
            className="absolute top-4 left-4 z-20 bg-white/80 dark:bg-black/80 hover:bg-white dark:hover:bg-black backdrop-blur-sm"
          >
            {activeItem.isFavorite ? (
              <Heart className="text-red-500 fill-red-500 w-5 h-5" />
            ) : (
              <HeartOff className="text-gray-400 w-5 h-5" />
            )}
          </Button>

          {/* Main Image */}
          <div className="w-full h-full flex items-center justify-center p-8">
            {activeItem.imageUrl ? (
              <img
                src={activeItem.imageUrl}
                alt={activeItem.title}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400">
                <div className="text-2xl font-medium mb-2">{activeItem.title}</div>
                <div className="text-sm">No image available</div>
              </div>
            )}
          </div>

          {/* Image Info and Actions */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <h3 className="text-xl font-semibold mb-1">{activeItem.title}</h3>
                <p className="text-sm text-gray-300">
                  {activeIndex + 1} of {items.length}
                </p>
              </div>
              
              {activeItem.links.length > 0 && (
                <Button
                  onClick={() => setShowLinks(!showLinks)}
                  variant="outline"
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  {showLinks ? 'Hide Links' : 'Show Links'}
                </Button>
              )}
            </div>

            {/* Links Panel */}
            <AnimatePresence>
              {showLinks && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-4"
                >
                  <div className="grid gap-3">
                    {activeItem.links.map((link, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(link.url, '_blank')}
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
                            {copiedIndex === index ? 'Copied!' : (
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

        {/* Progress Indicator */}
        <div className="mx-4 mb-2">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Image {activeIndex + 1} of {items.length}</span>
            <span>{Math.round(((activeIndex + 1) / items.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((activeIndex + 1) / items.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Bottom Row - Horizontal Thumbnail List */}
        <div className="h-32 mx-4 mb-4">
          <div
            ref={thumbnailRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide pb-4"
          >
            {items.map((item, index) => (
              <div
                key={item.id}
                ref={index === items.length - 1 ? lastItemRef : null}
                className={`flex-shrink-0 cursor-pointer transition-all duration-200 ${
                  index === activeIndex 
                    ? 'ring-2 ring-blue-500 scale-105' 
                    : 'hover:scale-105'
                }`}
                onClick={() => {
                  setActiveIndex(index);
                  scrollToThumbnail(index);
                }}
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
  );
} 