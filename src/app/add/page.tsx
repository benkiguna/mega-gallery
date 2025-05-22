"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { encryptText } from "@/lib/crypto-utils";
import { Spinner } from "@guna/components/ui/spinner";

export default function AddGalleryItemForm() {
  const [formState, setFormState] = useState({
    title: "",
    image: "",
    urls: Array(8).fill(""),
    passwords: Array(8).fill(""),
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleInputChange = (
    index: number,
    type: "url" | "password",
    value: string
  ) => {
    setFormState((prev) => {
      const updated = { ...prev };
      if (type === "url") updated.urls[index] = value;
      else updated.passwords[index] = value;
      return updated;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result?.toString() || "";
      const encrypted = await encryptText(base64);
      setFormState((prev) => ({ ...prev, image: encrypted }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const encryptedTitle = await encryptText(formState.title);

      const links = await Promise.all(
        formState.urls.map(async (url, index) => {
          if (!url) return null;
          const encryptedUrl = await encryptText(url);
          const password = formState.passwords[index];
          const encryptedPassword = password
            ? await encryptText(password)
            : undefined;
          return { url: encryptedUrl, password: encryptedPassword };
        })
      );

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: encryptedTitle,
          image: formState.image,
          links: links.filter(Boolean),
        }),
      });

      const result = await res.json();
      if (res.ok) {
        setMessage("Item uploaded successfully!");
        setFormState({
          title: "",
          image: "",
          urls: Array(8).fill(""),
          passwords: Array(8).fill(""),
        });
      } else {
        setMessage(result?.error || "Upload failed.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setMessage("Unexpected error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-10 flex flex-col items-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-center text-xl">
            Add Gallery Item
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label>Title</Label>
              <Input
                required
                value={formState.title}
                onChange={(e) =>
                  setFormState({ ...formState, title: e.target.value })
                }
                placeholder="Enter title"
              />
            </div>

            <div>
              <Label>Upload Image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>

            {[...Array(8)].map((_, i) => (
              <div key={i} className="grid grid-cols-2 gap-2">
                <div>
                  <Label>URL {i + 1}</Label>
                  <Input
                    value={formState.urls[i]}
                    onChange={(e) =>
                      handleInputChange(i, "url", e.target.value)
                    }
                    placeholder={`URL ${i + 1}`}
                  />
                </div>
                <div>
                  <Label>Password {i + 1}</Label>
                  <Input
                    value={formState.passwords[i]}
                    onChange={(e) =>
                      handleInputChange(i, "password", e.target.value)
                    }
                    placeholder={`Password ${i + 1}`}
                  />
                </div>
              </div>
            ))}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Uploading..." : "Upload Item"}
            </Button>
            {submitting && (
              <div className="flex justify-center items-center py-12">
                <Spinner className="w-6 h-6" />
              </div>
            )}
            {message && (
              <p className="text-center text-sm pt-2 text-muted-foreground">
                {message}
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
