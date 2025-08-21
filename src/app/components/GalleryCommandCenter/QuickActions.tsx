"use client";

import { motion } from 'framer-motion';
import { useGalleryStore } from '@/app/stores/galleryStore';
import { 
  ArrowPathIcon,
  Cog6ToothIcon,
  PhotoIcon,
  FolderPlusIcon
} from '@heroicons/react/24/outline';

export function QuickActions() {
  const {
    resetToDefaults,
    toggleAnimations,
    enableAnimations
  } = useGalleryStore();

  const actions = [
    {
      icon: ArrowPathIcon,
      label: 'Reset',
      onClick: resetToDefaults,
      className: 'hover:bg-orange-100 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400'
    },
    {
      icon: Cog6ToothIcon,
      label: 'Settings',
      onClick: () => {}, // TODO: Open settings modal
      className: 'hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300'
    }
  ];

  return (
    <div className="flex items-center gap-1">
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <motion.button
            key={index}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={action.onClick}
            className={`p-2 rounded-xl transition-colors ${action.className}`}
            title={action.label}
          >
            <Icon className="w-5 h-5" />
          </motion.button>
        );
      })}
    </div>
  );
}