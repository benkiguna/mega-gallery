"use client";

import GalleryUploader from "./GalleryUploader";

export default function MainTabs() {
  return (
    <div className="w-full px-4 py-6 flex flex-col items-center bg-white dark:bg-black">
      <div className="w-full max-w-6xl">
        <GalleryUploader />
      </div>
    </div>
  );
} 