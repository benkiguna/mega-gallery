"use client";

import { useState } from "react";
import GalleryCard from "./GalleryCard";
import { parse, type ParseResult } from "papaparse";
import AnimatedCard from "./AnimatedCard";
import { decryptText } from "@/lib/crypto-utils";


type GalleryItem = {
  title: string;
  image?: string;
  url: string;
};

function looksEncrypted(str: string | undefined): boolean {
  return typeof str === "string" && str.length > 50 && !str.includes(" ");
}

export default function GalleryUploader() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result: ParseResult<GalleryItem>) => {
        try {
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
        } catch (err) {
          console.error("Error while parsing or decrypting:", err);
          setError("Something went wrong while processing the file.");
        } finally {
          setLoading(false);
        }
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

      {loading && (
        <div className="text-center text-gray-500 py-8">Loading gallery...</div>
      )}

      {error && (
        <div className="text-red-600 text-center py-4">{error}</div>
      )}

      {!loading && !error && (
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
      )}
    </div>
  );
}
