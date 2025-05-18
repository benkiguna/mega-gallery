"use client";

import { useState } from "react";
import GalleryCard from "./GalleryCard";
import { parse, type ParseResult } from "papaparse";
import AnimatedCard from "./AnimatedCard";
import { decryptText } from "../get-base64/page"; // adjust path if needed

type GalleryItem = {
  title: string;
  image?: string;
  url: string;
};

function looksEncrypted(str: string | undefined): boolean {
  return typeof str === "string" && /^[A-Za-z0-9+/=]{40,}$/.test(str);
}

export default function GalleryUploader() {
  const [items, setItems] = useState<GalleryItem[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result: ParseResult<GalleryItem>) => {
        const rows = result.data;

        const decryptedRows = await Promise.all(
          rows.map(async (item) => {
            const title = looksEncrypted(item.title) ? await safeDecrypt(item.title) : item.title;
            const image = looksEncrypted(item.image) ? await safeDecrypt(item.image) : item.image;
            const url = looksEncrypted(item.url) ? await safeDecrypt(item.url) : item.url;

            return { title, image, url };
          })
        );

        setItems(decryptedRows.filter((item) => item.title || item.image || item.url));
      },
    });
  };

  async function safeDecrypt(value?: string): Promise<string> {
    try {
      return await decryptText(value!);
    } catch {
      return value ?? "";
    }
  }

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
          <AnimatedCard key={index} delay={(index % 2) * 0.2}>
            <GalleryCard
              title={item.title}
              imageUrl={item.image}
              link={item.url}
            />
          </AnimatedCard>
        ))}
      </div>
    </div>
  );
}
