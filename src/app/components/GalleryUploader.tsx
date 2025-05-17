"use client";

import { useState } from "react";
import GalleryCard from "./GalleryCard";
import { parse, type ParseResult } from "papaparse"



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
    parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result: ParseResult<GalleryItem>) => {
        const data = result.data;
        setItems(data.filter((item) => item.title || item.image || item.url));
      },
    });
    
  };
  
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
