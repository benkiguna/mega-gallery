"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Hash } from "lucide-react";

type TagWithCount = {
  id: string;
  name: string;
  color: string;
  count: number;
};

type TagFilterBarProps = {
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
  className?: string;
};

export default function TagFilterBar({
  selectedTagIds,
  onTagsChange,
  className = "",
}: TagFilterBarProps) {
  const [allTags, setAllTags] = useState<TagWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTagStats();
  }, []);

  const fetchTagStats = async () => {
    try {
      const response = await fetch("/api/tags/stats");
      const data = await response.json();
      if (data.success) {
        setAllTags(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch tag stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tagId: string) => {
    const newSelectedTags = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter(id => id !== tagId)
      : [...selectedTagIds, tagId];
    
    onTagsChange(newSelectedTags);
  };

  const clearAllTags = () => {
    onTagsChange([]);
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Hash size={16} className="text-gray-400" />
        <span className="text-sm text-gray-500">Loading tags...</span>
      </div>
    );
  }

  if (allTags.length === 0) {
    return (
      <div className={`flex items-center gap-2 text-gray-500 ${className}`}>
        <Hash size={16} />
        <span className="text-sm">No tags available</span>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hash size={16} className="text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter by Tags
          </span>
          {selectedTagIds.length > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({selectedTagIds.length} selected)
            </span>
          )}
        </div>
        
        {selectedTagIds.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllTags}
            className="h-6 px-2 text-xs"
          >
            <X size={12} className="mr-1" />
            Clear all
          </Button>
        )}
      </div>

      {/* Tag List */}
      <div className="flex flex-wrap gap-2">
        {allTags.map((tag) => {
          const isSelected = selectedTagIds.includes(tag.id);
          return (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                isSelected
                  ? "text-white shadow-md transform scale-105"
                  : "text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              style={{
                backgroundColor: isSelected ? tag.color : undefined,
                borderColor: isSelected ? tag.color : undefined,
              }}
            >
              <span className="truncate max-w-24">{tag.name}</span>
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                  isSelected
                    ? "bg-white/20 text-white"
                    : "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                }`}
              >
                {tag.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Tags Summary */}
      {selectedTagIds.length > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 pt-1">
          Showing images with any of the selected tags
        </div>
      )}
    </div>
  );
}