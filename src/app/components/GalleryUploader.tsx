"use client";

import { useEffect, useState } from "react";
import GalleryCard from "./GalleryCard";
import { parse, type ParseResult } from "papaparse";
import AnimatedCard from "./AnimatedCard";
import { decryptText } from "@/lib/crypto-utils";
import { Input } from "@/components/ui/input";
import { Button } from "@guna/components/ui/button";

type RawCSVRow = Record<string, string | undefined>;

type LinkItem = {
  url: string;
  password?: string;
};

type GalleryItem = {
  title: string;
  image?: string;
  links: LinkItem[];
  index?: number;
  showDevTitle?: boolean;
};

function looksEncrypted(str: string | undefined): boolean {
  return typeof str === "string" && str.length > 20 && !str.includes(" ");
}

export default function GalleryUploader() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showDevTitle, setShowDevTitle] = useState(false);

  const [progress, setProgress] = useState(0);
  const [currentRow, setCurrentRow] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [view, setView] = useState<"grid" | "list">("grid");

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredItems, setFilteredItems] = useState<GalleryItem[]>([]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "t") {
        setShowDevTitle((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    const q = searchQuery.toLowerCase();
    setFilteredItems(
      items.filter((item) => item.title?.toLowerCase().includes(q))
    );
  }, [searchQuery, items]);

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
            setTotalRows(rows.length);
            setCurrentRow(0);

            const decryptedRows: GalleryItem[] = await Promise.all(
              rows.map(async (row, i) => {
                const title = looksEncrypted(row.title)
                  ? await safeDecrypt(row.title)
                  : (row.title ?? "");
                const image = looksEncrypted(row.image)
                  ? await safeDecrypt(row.image)
                  : row.image;

                const links: LinkItem[] = [];
                for (const [key, value] of Object.entries(row)) {
                  if (key.startsWith("url") && value) {
                    const index = key === "url" ? "" : key.slice(3);
                    const passwordKey = `password${index}`;

                    const decryptedUrl = looksEncrypted(value)
                      ? await safeDecrypt(value)
                      : value;
                    const passwordVal = row[passwordKey];
                    const decryptedPassword = looksEncrypted(passwordVal)
                      ? await safeDecrypt(passwordVal)
                      : passwordVal;

                    links.push({
                      url: decryptedUrl,
                      password: decryptedPassword || undefined,
                    });
                  }
                }

                // Progress tracking
                setCurrentRow((prev) => prev + 1);
                setProgress(Math.round(((i + 1) / rows.length) * 100));

                return { title, image, links };
              })
            );

            setItems(
              decryptedRows.filter(
                (item) => item.title || item.image || item.links.length
              )
            );
            setFilteredItems(
              decryptedRows.filter(
                (item) => item.title || item.image || item.links.length
              )
            );
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

  return (
    <div className="w-full px-4 py-6 flex flex-col items-center bg-white dark:bg-black">
      <div className="w-full max-w-md">
        <Input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="mb-6 w-full text-base rounded bg-white shadow border border-input dark:bg-black text-black dark:text-white border dark:border-gray-700"
        />
      </div>

      {loading && (
        <div className="w-full max-w-md py-6">
          <div className="mb-2 text-sm text-center text-gray-500">
            Parsing row {currentRow} of {totalRows}
          </div>
          <div className="w-full h-3 rounded bg-gray-200 overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="sticky top-14 z-10 bg-white dark:bg-black border-b dark:border-gray-700 w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-3 py-4 px-2 transition-colors">
        <Input
          type="text"
          placeholder="Search by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
        <div className="flex gap-2 items-center justify-end max-w-4xl">
          <Button
            variant={view === "grid" ? "outline" : "default"}
            size="sm"
            onClick={() => setView("grid")}
          >
            Grid
          </Button>
          <Button
            variant={view === "list" ? "outline" : "default"}
            size="sm"
            onClick={() => setView("list")}
          >
            List
          </Button>
        </div>
      </div>

      {error && <div className="text-red-600 text-center py-4">{error}</div>}

      {!loading && !error && (
        <div
          className={`grid gap-4 w-full max-w-4xl px-2 mt-6 ${
            view === "grid" ? "grid-cols-2" : "grid-cols-1"
          }`}
        >
          {filteredItems.map((item, index) => (
            <div key={index} className="w-full">
              <AnimatedCard delay={(index % 2) * 0.1}>
                <GalleryCard
                  title={item.title}
                  imageUrl={item.image}
                  links={item.links}
                  index={index}
                  showDevTitle={showDevTitle}
                />
              </AnimatedCard>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
