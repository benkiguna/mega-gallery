"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, Check } from "lucide-react";

type TagItem = {
  id: string;
  name: string;
  color: string;
};

type TagModalProps = {
  isOpen: boolean;
  onClose: () => void;
  imageId: string;
  existingTags: TagItem[];
  onTagsUpdated: (tags: TagItem[]) => void;
};

export default function TagModal({
  isOpen,
  onClose,
  imageId,
  existingTags,
  onTagsUpdated,
}: TagModalProps) {
  const [allTags, setAllTags] = useState<TagItem[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [newTagName, setNewTagName] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTags();
      setSelectedTags(new Set(existingTags.map(tag => tag.id)));
    }
  }, [isOpen, existingTags]);

  const fetchTags = async () => {
    try {
      const response = await fetch("/api/tags");
      const data = await response.json();
      if (data.success) {
        setAllTags(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    }
  };

  const createTag = async () => {
    if (!newTagName.trim()) return;

    setCreating(true);
    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName.trim() }),
      });

      const data = await response.json();
      if (data.success) {
        const newTag = data.data;
        setAllTags(prev => [...prev, newTag]);
        setSelectedTags(prev => new Set([...prev, newTag.id]));
        setNewTagName("");
      } else {
        alert(data.error || "Failed to create tag");
      }
    } catch (error) {
      console.error("Failed to create tag:", error);
      alert("Failed to create tag");
    } finally {
      setCreating(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tagId)) {
        newSet.delete(tagId);
      } else {
        newSet.add(tagId);
      }
      return newSet;
    });
  };

  const saveTags = async () => {
    setLoading(true);
    try {
      const currentTagIds = new Set(existingTags.map(tag => tag.id));
      const selectedTagIds = selectedTags;

      // Find tags to add and remove
      const tagsToAdd = [...selectedTagIds].filter(id => !currentTagIds.has(id));
      const tagsToRemove = [...currentTagIds].filter(id => !selectedTagIds.has(id));

      // Add new tags
      for (const tagId of tagsToAdd) {
        await fetch("/api/image-tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageId, tagId }),
        });
      }

      // Remove tags
      for (const tagId of tagsToRemove) {
        await fetch(`/api/image-tags?imageId=${imageId}&tagId=${tagId}`, {
          method: "DELETE",
        });
      }

      // Update parent component with new tags
      const updatedTags = allTags.filter(tag => selectedTagIds.has(tag.id));
      onTagsUpdated(updatedTags);
      onClose();
    } catch (error) {
      console.error("Failed to save tags:", error);
      alert("Failed to save tags");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <h3 className="text-lg font-semibold">Manage Tags</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-96 overflow-y-auto">
            {/* Create New Tag */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Create New Tag</label>
              <div className="flex gap-2">
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Tag name"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      createTag();
                    }
                  }}
                />
                <Button
                  onClick={createTag}
                  disabled={!newTagName.trim() || creating}
                  size="sm"
                >
                  {creating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
                  ) : (
                    <Plus size={16} />
                  )}
                </Button>
              </div>
            </div>

            {/* Existing Tags */}
            <div>
              <label className="block text-sm font-medium mb-2">Select Tags</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {allTags.map((tag) => (
                  <div
                    key={tag.id}
                    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
                      selectedTags.has(tag.id)
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                        : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                    }`}
                    onClick={() => toggleTag(tag.id)}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm">{tag.name}</span>
                    </div>
                    {selectedTags.has(tag.id) && (
                      <Check size={16} className="text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                ))}
                {allTags.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No tags available. Create one above.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 border-t dark:border-gray-700">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={saveTags} disabled={loading}>
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : null}
              Save Tags
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}