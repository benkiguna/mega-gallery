import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ViewMode = 'grid' | 'list' | 'masonry';
export type DesignMode = 'classic' | 'modern';
export type FilterMode = 'all' | 'favorites';

interface GalleryState {
  // View settings
  designMode: DesignMode;
  viewMode: ViewMode;
  filterMode: FilterMode;
  
  // UI state
  showControls: boolean;
  isCommandCenterVisible: boolean;
  searchQuery: string;
  selectedTagIds: string[];
  
  // Layout settings
  gridDensity: number; // 1-5 scale for grid density
  thumbnailSize: number; // 1-3 scale for thumbnail size
  showImageTitles: boolean;
  showImageCounts: boolean;
  
  // Performance settings
  enableAnimations: boolean;
  prefetchImages: boolean;
  
  // Actions
  setDesignMode: (mode: DesignMode) => void;
  setViewMode: (mode: ViewMode) => void;
  setFilterMode: (mode: FilterMode) => void;
  setShowControls: (show: boolean) => void;
  setCommandCenterVisible: (visible: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSelectedTagIds: (tagIds: string[]) => void;
  addSelectedTag: (tagId: string) => void;
  removeSelectedTag: (tagId: string) => void;
  clearSelectedTags: () => void;
  setGridDensity: (density: number) => void;
  setThumbnailSize: (size: number) => void;
  toggleImageTitles: () => void;
  toggleImageCounts: () => void;
  toggleAnimations: () => void;
  togglePrefetchImages: () => void;
  resetToDefaults: () => void;
}

const defaultState = {
  designMode: 'modern' as DesignMode,
  viewMode: 'grid' as ViewMode,
  filterMode: 'all' as FilterMode,
  showControls: false,
  isCommandCenterVisible: true,
  searchQuery: '',
  selectedTagIds: [],
  gridDensity: 3,
  thumbnailSize: 2,
  showImageTitles: true,
  showImageCounts: true,
  enableAnimations: true,
  prefetchImages: true,
};

export const useGalleryStore = create<GalleryState>()(
  persist(
    (set, get) => ({
      ...defaultState,

      // Actions
      setDesignMode: (mode) => set({ designMode: mode }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setFilterMode: (mode) => set({ filterMode: mode }),
      setShowControls: (show) => set({ showControls: show }),
      setCommandCenterVisible: (visible) => set({ isCommandCenterVisible: visible }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedTagIds: (tagIds) => set({ selectedTagIds: tagIds }),
      
      addSelectedTag: (tagId) => {
        const { selectedTagIds } = get();
        if (!selectedTagIds.includes(tagId)) {
          set({ selectedTagIds: [...selectedTagIds, tagId] });
        }
      },
      
      removeSelectedTag: (tagId) => {
        const { selectedTagIds } = get();
        set({ selectedTagIds: selectedTagIds.filter(id => id !== tagId) });
      },
      
      clearSelectedTags: () => set({ selectedTagIds: [] }),
      setGridDensity: (density) => set({ gridDensity: Math.max(1, Math.min(5, density)) }),
      setThumbnailSize: (size) => set({ thumbnailSize: Math.max(1, Math.min(3, size)) }),
      toggleImageTitles: () => set((state) => ({ showImageTitles: !state.showImageTitles })),
      toggleImageCounts: () => set((state) => ({ showImageCounts: !state.showImageCounts })),
      toggleAnimations: () => set((state) => ({ enableAnimations: !state.enableAnimations })),
      togglePrefetchImages: () => set((state) => ({ prefetchImages: !state.prefetchImages })),
      
      resetToDefaults: () => set(defaultState),
    }),
    {
      name: 'gallery-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        designMode: state.designMode,
        viewMode: state.viewMode,
        filterMode: state.filterMode,
        gridDensity: state.gridDensity,
        thumbnailSize: state.thumbnailSize,
        showImageTitles: state.showImageTitles,
        showImageCounts: state.showImageCounts,
        enableAnimations: state.enableAnimations,
        prefetchImages: state.prefetchImages,
      }),
    }
  )
);

// Selector hooks for better performance
export const useDesignMode = () => useGalleryStore((state) => state.designMode);
export const useViewMode = () => useGalleryStore((state) => state.viewMode);
export const useFilterMode = () => useGalleryStore((state) => state.filterMode);
export const useSearchQuery = () => useGalleryStore((state) => state.searchQuery);
export const useSelectedTagIds = () => useGalleryStore((state) => state.selectedTagIds);
export const useCommandCenterVisible = () => useGalleryStore((state) => state.isCommandCenterVisible);
export const useAnimationsEnabled = () => useGalleryStore((state) => state.enableAnimations);