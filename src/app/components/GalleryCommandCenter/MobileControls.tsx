"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGalleryStore } from '@/app/stores/galleryStore';
import { 
  ChevronUpIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { SearchSection } from './SearchSection';
import { ViewControls } from './ViewControls';

export function MobileControls() {
  const [isOpen, setIsOpen] = useState(false);
  const { isCommandCenterVisible } = useGalleryStore();

  if (!isCommandCenterVisible) return null;

  return (
    <>
      {/* Bottom Sheet Trigger */}
      <motion.div
        className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="px-6 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full shadow-lg backdrop-blur-xl flex items-center gap-2"
        >
          <AdjustmentsHorizontalIcon className="w-5 h-5" />
          <span className="text-sm font-medium">Controls</span>
        </motion.button>
      </motion.div>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden"
            >
              {/* Handle */}
              <div className="flex justify-center py-3">
                <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold">Gallery Controls</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[60vh] p-6 space-y-6">
                {/* Search Section */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
                    Search & Filters
                  </h3>
                  <SearchSection />
                </div>

                {/* View Controls */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
                    View Settings
                  </h3>
                  <ViewControls />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}