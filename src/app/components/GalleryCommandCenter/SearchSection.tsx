"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGalleryStore } from '@/app/stores/galleryStore';
import { 
  MagnifyingGlassIcon, 
  XMarkIcon,
  HashtagIcon,
  HeartIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import TagFilterBar from '../TagFilterBar';

interface SearchSectionProps {
  compact?: boolean;
}

export function SearchSection({ compact = false }: SearchSectionProps) {
  const {
    searchQuery,
    selectedTagIds,
    filterMode,
    setSearchQuery,
    setSelectedTagIds,
    setFilterMode,
    clearSelectedTags
  } = useGalleryStore();

  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sample search suggestions (in a real app, these would come from API)
  const searchSuggestions = [
    { type: 'recent', label: 'nature photos', icon: ClockIcon },
    { type: 'recent', label: 'vacation 2024', icon: ClockIcon },
    { type: 'tag', label: 'landscape', icon: HashtagIcon },
    { type: 'tag', label: 'portrait', icon: HashtagIcon },
    { type: 'filter', label: 'favorites', icon: HeartIcon },
  ];

  const handleClearAll = () => {
    setSearchQuery('');
    clearSelectedTags();
    setFilterMode('all');
  };

  const hasActiveFilters = searchQuery || selectedTagIds.length > 0 || filterMode === 'favorites';

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {/* Compact Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search..."
            className="w-48 pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-0 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all"
          />
        </div>

        {/* Active Filters Indicator */}
        {hasActiveFilters && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1"
          >
            {selectedTagIds.length > 0 && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                {selectedTagIds.length} tags
              </span>
            )}
            {filterMode === 'favorites' && (
              <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs rounded-full">
                Favorites
              </span>
            )}
            <button
              onClick={handleClearAll}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <XMarkIcon className="w-4 h-4 text-gray-500" />
            </button>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Enhanced Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            setShowSuggestions(true);
          }}
          onBlur={() => {
            setIsFocused(false);
            // Delay hiding suggestions to allow clicks
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          placeholder="Search by title, description, or tags..."
          className="w-full pl-12 pr-12 py-3 bg-gray-50 dark:bg-gray-800 border-0 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all"
        />
        
        {/* Clear Button */}
        {searchQuery && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center"
          >
            <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          </motion.button>
        )}

        {/* Search Suggestions */}
        <AnimatePresence>
          {showSuggestions && isFocused && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-10"
            >
              <div className="p-2">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-2">
                  Quick Search
                </div>
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (suggestion.type === 'filter' && suggestion.label === 'favorites') {
                        setFilterMode('favorites');
                      } else {
                        setSearchQuery(suggestion.label);
                      }
                      setShowSuggestions(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                  >
                    <suggestion.icon className="w-4 h-4 text-gray-400" />
                    <span>{suggestion.label}</span>
                    <span className="ml-auto text-xs text-gray-400 capitalize">
                      {suggestion.type}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Filter Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Quick filters:
        </span>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setFilterMode(filterMode === 'favorites' ? 'all' : 'favorites')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filterMode === 'favorites'
              ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <HeartIcon className="w-4 h-4 inline mr-1" />
          Favorites
        </motion.button>

        {hasActiveFilters && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClearAll}
            className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon className="w-4 h-4 inline mr-1" />
            Clear all
          </motion.button>
        )}
      </div>

      {/* Tag Filter Bar */}
      <TagFilterBar
        selectedTagIds={selectedTagIds}
        onTagsChange={setSelectedTagIds}
      />
    </div>
  );
}