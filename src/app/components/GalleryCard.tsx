"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

type LinkItem = {
  url: string;
  password?: string;
};

type GalleryCardProps = {
  title: string;
  imageUrl?: string;
  links: LinkItem[];
  index?: number;
  showDevTitle?: boolean;
};

export default function GalleryCard({
  title,
  imageUrl,
  links,
  index,
  showDevTitle,
}: GalleryCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

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

  return (
    <div
      className="relative w-full aspect-square p-4"
      style={{ perspective: 1000 }}
    >
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
          className="absolute inset-0 w-full h-full rounded shadow-md border bg-white p-4 flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300"
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
                  className="truncate max-w-[70%] text-left text-blue-600"
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

          {isFlippable && (
            <div className="flex justify-end mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setFlipped(false);
                }}
              ></Button>
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
