"use client";

import { motion } from 'framer-motion';
import { useGalleryStore, ViewMode, DesignMode } from '@/app/stores/galleryStore';
import { 
  Squares2X2Icon,
  ListBulletIcon,
  RectangleStackIcon,
  SwatchIcon,
  CubeIcon,
  AdjustmentsVerticalIcon
} from '@heroicons/react/24/outline';

interface ViewControlsProps {
  compact?: boolean;
}

export function ViewControls({ compact = false }: ViewControlsProps) {
  const {
    designMode,
    viewMode,
    gridDensity,
    thumbnailSize,
    setDesignMode,
    setViewMode,
    setGridDensity,
    setThumbnailSize
  } = useGalleryStore();

  const viewModes = [
    { value: 'grid' as ViewMode, label: 'Grid', icon: Squares2X2Icon },
    { value: 'list' as ViewMode, label: 'List', icon: ListBulletIcon },
    { value: 'masonry' as ViewMode, label: 'Masonry', icon: RectangleStackIcon },
  ];

  const designModes = [
    { value: 'modern' as DesignMode, label: 'Modern', icon: CubeIcon },
    { value: 'classic' as DesignMode, label: 'Classic', icon: SwatchIcon },
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {/* Design Mode Toggle - Modern/Classic */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {designModes.map((mode) => {
            const Icon = mode.icon;
            return (
              <motion.button
                key={mode.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDesignMode(mode.value)}
                className={`relative px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  designMode === mode.value
                    ? 'text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {designMode === mode.value && (
                  <motion.div
                    layoutId="designModeBackground"
                    className="absolute inset-0 bg-blue-500 rounded-md"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1">
                  <Icon className="w-4 h-4" />
                  {mode.label}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* View Mode for Classic */}
        {designMode === 'classic' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1"
          >
            {viewModes.slice(0, 2).map((mode) => {
              const Icon = mode.icon;
              return (
                <motion.button
                  key={mode.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode(mode.value)}
                  className={`relative px-2 py-1 rounded-md text-sm transition-colors ${
                    viewMode === mode.value
                      ? 'text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  {viewMode === mode.value && (
                    <motion.div
                      layoutId="viewModeBackground"
                      className="absolute inset-0 bg-green-500 rounded-md"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className="w-4 h-4 relative z-10" />
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Design Mode Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Gallery Design
        </label>
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          {designModes.map((mode) => {
            const Icon = mode.icon;
            return (
              <motion.button
                key={mode.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setDesignMode(mode.value)}
                className={`relative flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  designMode === mode.value
                    ? 'text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {designMode === mode.value && (
                  <motion.div
                    layoutId="designModeBackgroundFull"
                    className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <div className="relative z-10 flex items-center justify-center gap-2">
                  <Icon className="w-5 h-5" />
                  <span>{mode.label}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* View Mode Selection (for Classic) */}
      {designMode === 'classic' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            View Layout
          </label>
          <div className="grid grid-cols-3 gap-2">
            {viewModes.map((mode) => {
              const Icon = mode.icon;
              return (
                <motion.button
                  key={mode.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setViewMode(mode.value)}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    viewMode === mode.value
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Icon className={`w-6 h-6 ${
                      viewMode === mode.value 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`} />
                    <span className={`text-sm font-medium ${
                      viewMode === mode.value 
                        ? 'text-green-700 dark:text-green-300' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {mode.label}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Layout Controls */}
      <div className="grid grid-cols-2 gap-6">
        {/* Grid Density */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Grid Density
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="1"
              max="5"
              value={gridDensity}
              onChange={(e) => setGridDensity(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Sparse</span>
              <span>Dense</span>
            </div>
          </div>
        </div>

        {/* Thumbnail Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Thumbnail Size
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="1"
              max="3"
              value={thumbnailSize}
              onChange={(e) => setThumbnailSize(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Small</span>
              <span>Large</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}