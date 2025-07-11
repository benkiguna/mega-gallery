"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Copy, Heart, HeartOff } from "lucide-react"; // ❤️ Icons

type LinkItem = {
  url: string;
  password?: string;
};

type GalleryCardProps = {
  id: string;
  title: string;
  imageUrl?: string;
  links: LinkItem[];
  index?: number;
  showDevTitle?: boolean;
  isFavorite: boolean;
};

export default function GalleryCard({
  id,
  title,
  imageUrl,
  links,
  index,
  showDevTitle,
  isFavorite: initialFavorite,
}: GalleryCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isFavorite, setIsFavorite] = useState(initialFavorite);

  const isFlippable = links.length > 1 || links[0]?.password;

  const handleCopy = async (password: string, index: number) => {
    try {
      await navigator.clipboard.writeText(password);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleCardClick = () => {
    if (!isFlippable && links.length === 1) {
      window.open(links[0].url, "_blank");
      return;
    }
    setFlipped(!flipped);
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newFavorite = !isFavorite;
    setIsFavorite(newFavorite);

    await fetch("/api/gallery/favorite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: id, isFavorite: newFavorite }),
    });
  };

  return (
    <div
      className="relative w-full aspect-square p-4 dark:bg-[#1e1e1f]"
      style={{ perspective: 1000 }}
    >
      {/* Top-right favorite toggle */}
      <button
        onClick={toggleFavorite}
        className="absolute top-6 right-6 z-20 bg-white dark:bg-black/50 rounded-full p-1 shadow hover:scale-110 transition"
      >
        {isFavorite ? (
          <Heart className="text-red-500 fill-red-500 w-4 h-4" />
        ) : (
          <HeartOff className="text-gray-400 w-4 h-4" />
        )}
      </button>

      {showDevTitle && index !== undefined && (
        <div className="text-sm text-gray-400 text-center mb-2">
          {index + 1}
        </div>
      )}

      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
        onClick={handleCardClick}
      >
        {/* Front Face */}
        <div
          className="absolute inset-0 w-full h-full rounded shadow hover:shadow-md overflow-hidden border bg-white"
          style={{ backfaceVisibility: "hidden" }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center px-3 text-center text-sm text-gray-600 bg-gray-50">
              {title}
            </div>
          )}
        </div>

        {/* Back Face */}
        <div
          className="absolute inset-0 w-full h-full rounded shadow-md border bg-white dark:bg-[#1e1e1f] dark:text-gray-200 p-4 flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400"
          style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}
        >
          <div className="flex flex-col gap-3">
            {links.map((link, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3"
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(link.url, "_blank", "noopener,noreferrer");
                  }}
                  className="truncate max-w-[70%] text-left text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 transition"
                >
                  Visit Link {index + 1}
                </Button>

                {link.password && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(link.password!, index);
                    }}
                    className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  >
                    {copiedIndex === index ? (
                      "Copied!"
                    ) : (
                      <>
                        <Copy size={14} />
                        Copy Password
                      </>
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>

          {isFlippable && (
            <div className="flex justify-end mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setFlipped(false);
                }}
                className="text-xs text-gray-500 dark:text-gray-400 hover:underline"
              >
                ← Back
              </Button>
            </div>
          )}
        </div>
      </motion.div>
      <div className="text-sm text-gray-400 text-center mt-3 capitalize">
        {title}
      </div>
    </div>
  );
}
