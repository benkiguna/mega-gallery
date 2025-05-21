"use client";

import { useState } from "react";
import { parse } from "papaparse";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type RawRow = Record<string, string>;

export default function UploadPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatus(null);

    parse<RawRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rows: result.data }),
          });

          const body = await res.json();
          setStatus(`Uploaded ${body.count} items.`);
        } catch (err) {
          console.error(err);
          setStatus("Upload failed.");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <Input
        type="file"
        accept=".csv"
        onChange={handleUpload}
        className="mb-4"
      />
      {loading ? (
        <p className="text-sm text-muted-foreground">Uploading...</p>
      ) : (
        <Button disabled>Upload CSV</Button> // Optional static button
      )}
      {status && <p className="mt-4 text-sm">{status}</p>}
    </div>
  );
}
