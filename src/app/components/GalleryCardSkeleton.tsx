export default function GalleryCardSkeleton() {
  return (
    <div className="w-full aspect-square p-4">
      <div
        className="w-full h-full rounded-xl border border-gray-300 dark:border-white/20 bg-gray-200 dark:bg-white/10 shadow-md animate-pulse"
        style={{
          boxShadow: "0 0 20px rgba(0, 0, 0, 0.05)",
        }}
      />
    </div>
  );
}
