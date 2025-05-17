"use client";

import Papa from "papaparse";
import { useState } from "react";
import GalleryCard from "./GalleryCard";


type GalleryItem = {
    title: string;
    image?: string; // from CSV
    url: string;
  };
  
  

export default function GalleryUploader() {
  const [items, setItems] = useState<GalleryItem[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const data = result.data as GalleryItem[];
        setItems(data.filter((item) => item.title || item.url));
      },
    });
  };
  console.log(items)
  return (
    <div>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="mb-4 block w-full"
      />
     <div className="grid grid-cols-2 gap-4 px-2">
  {items.map((item, index) => (
    <GalleryCard
      key={index}
      title={item.title}
      imageUrl={item.image}
      link={item.url}
    />
  ))}
</div>


    </div>
  );
}
