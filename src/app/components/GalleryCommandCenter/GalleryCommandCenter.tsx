"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useGalleryStore } from '@/app/stores/galleryStore';
import { 
  ChevronDownIcon, 
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  AdjustmentsHorizontalIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { SearchSection } from './SearchSection';
import { ViewControls } from './ViewControls';
import { QuickActions } from './QuickActions';
import { MobileControls } from './MobileControls';

export default function GalleryCommandCenter() {
  const {
    showControls,
    isCommandCenterVisible,
    designMode,
    enableAnimations,
    setShowControls,
    setCommandCenterVisible
  } = useGalleryStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Detect mobile and handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle scroll-based auto-hide
  useEffect(() => {
    let ticking = false;
    
    const updateScrollY = () => {
      setScrollY(window.scrollY);
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollY);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-hide command center when scrolling down
  const shouldAutoHide = scrollY > 100 && !isExpanded;

  if (!isCommandCenterVisible) return null;

  const containerVariants = {
    hidden: { 
      opacity: 0, 
      y: -20,
      scale: 0.98
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 30,
        mass: 0.8
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.98,
      transition: {
        duration: 0.2
      }
    }
  };

  const expandedVariants = {
    collapsed: { 
      height: "auto",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40
      }
    },
    expanded: { 
      height: "auto",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40
      }
    }
  };

  if (isMobile) {
    return <MobileControls />;
  }

  return (
    <LayoutGroup>
      <AnimatePresence>
        {!shouldAutoHide && (
          <motion.div
            layout
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-4xl px-4"
          >
            <motion.div
              layout
              className="relative"
            >
              {/* Main Command Center */}
              <motion.div
                layout
                variants={expandedVariants}
                animate={isExpanded ? "expanded" : "collapsed"}
                className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-xl overflow-hidden"
                style={{
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                }}
              >
                {/* Compact Header */}
                <motion.div 
                  layout
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    {/* Quick View Toggle */}
                    <ViewControls compact />
                    
                    {/* Search Preview */}
                    <SearchSection compact />
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Quick Actions */}
                    <QuickActions />
                    
                    {/* Expand Toggle */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDownIcon className="w-5 h-5" />
                      </motion.div>
                    </motion.button>

                    {/* Hide Toggle */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCommandCenterVisible(false)}
                      className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <EyeSlashIcon className="w-5 h-5" />
                    </motion.button>
                  </div>
                </motion.div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 40
                      }}
                      className="border-t border-gray-200/50 dark:border-gray-700/50"
                    >
                      <div className="p-6 space-y-6">
                        {/* Full Search Section */}
                        <SearchSection />
                        
                        {/* Full View Controls */}
                        <ViewControls />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Glass Effect Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl pointer-events-none" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show Command Center Button (when hidden) */}
      <AnimatePresence>
        {shouldAutoHide && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => {
              setCommandCenterVisible(true);
              setIsExpanded(true);
            }}
            className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 p-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          >
            <AdjustmentsHorizontalIcon className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
}