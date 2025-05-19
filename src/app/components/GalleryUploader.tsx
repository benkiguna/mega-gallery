"use client";

import { useState } from "react";
import GalleryCard from "./GalleryCard";
import { parse, type ParseResult } from "papaparse";
import AnimatedCard from "./AnimatedCard";
import { decryptText } from "@/lib/crypto-utils";
import { Input } from "@/components/ui/input";

type RawCSVRow = Record<string, string | undefined>;

type LinkItem = {
  url: string;
  password?: string;
};

type GalleryItem = {
  title: string;
  image?: string;
  links: LinkItem[];
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

    try {
      parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (result: ParseResult<RawCSVRow>) => {
          try {
            const rows = result.data;

            const decryptedRows: GalleryItem[] = await Promise.all(
              rows.map(async (row) => {
                const title = looksEncrypted(row.title) ? await safeDecrypt(row.title) : row.title ?? "";
                const image = looksEncrypted(row.image) ? await safeDecrypt(row.image) : row.image;
             
                const links: LinkItem[] = [];
                for (const [key, value] of Object.entries(row)) {
                  if (key.startsWith("url") && value) {
                    const index = key === "url" ? "" : key.slice(3);
                    const passwordKey = `password${index}`;
                
                    const decryptedUrl = looksEncrypted(value) ? await safeDecrypt(value) : value;
                    const passwordVal = row[passwordKey];
                    const decryptedPassword = looksEncrypted(passwordVal) ? await safeDecrypt(passwordVal) : passwordVal;
                
                    links.push({
                      url: decryptedUrl,
                      password: decryptedPassword || undefined,
                    });
                  }
                }
                
                return { title, image, links };
              })
            );

            setItems(decryptedRows.filter((item) => item.title || item.image || item.links.length));
          } catch (err) {
            console.error("Error while parsing or decrypting:", err);
            setError("Something went wrong while processing the file.");
          } finally {
            setLoading(false);
          }
        },
      });
    } catch (err) {
      console.error("Parse error:", err);
      setError("Failed to parse the CSV file.");
      setLoading(false);
    }
  };

  async function safeDecrypt(value?: string): Promise<string> {
    try {
      return await decryptText(value!);
    } catch {
      return value ?? "";
    }
  }

  console.log(items);
  return (
    <div className="w-full px-4 py-6 flex flex-col items-center">
      <div className="w-full max-w-md">
        <Input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="mb-6 text-base rounded shadow border border-input bg-background text-muted-foreground"
        />
      </div>

      {loading && (
        <div className="text-center text-gray-500 py-8">Loading gallery...</div>
      )}

      {error && (
        <div className="text-red-600 text-center py-4">{error}</div>
      )}

      {!loading && !error && (
       <div className="grid grid-cols-2 gap-4 w-full max-w-4xl px-2 mt-6">
       {items.map((item, index) => (
         <div key={index} className="w-full">
           <AnimatedCard delay={(index % 2) * 0.1}>
             <GalleryCard
               title={item.title}
               imageUrl={item.image}
               links={item.links}
             />
           </AnimatedCard>
         </div>
       ))}
     </div>
     
      )}
    </div>
  );
}
