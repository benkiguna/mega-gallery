"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";

interface Link {
  id: string;
  name: string;
  url: string;
  created_at: string;
}

export default function LinksManager() {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/links");
      const data = await response.json();
      if (data.success) {
        setLinks(data.data);
      }
    } catch (error) {
      console.error("Error fetching links:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    setUploading(true);
    try {
      const response = await fetch("/api/links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, url }),
      });

      const data = await response.json();
      if (data.success) {
        setName("");
        setUrl("");
        fetchLinks(); // Refresh the list
      }
    } catch (error) {
      console.error("Error uploading link:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleLinkClick = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <div className="w-full px-4 py-6 flex flex-col items-center bg-white dark:bg-black">
      <div className="w-full max-w-4xl">
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload Link</TabsTrigger>
            <TabsTrigger value="view">View Links</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="mt-6">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Upload New Link</h2>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <Label htmlFor="name">Link Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter a name for this link"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={uploading} className="w-full">
                  {uploading ? (
                    <>
                      <Spinner className="mr-2" />
                      Uploading...
                    </>
                  ) : (
                    "Upload Link"
                  )}
                </Button>
              </form>
            </div>
          </TabsContent>
          
          <TabsContent value="view" className="mt-6">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Your Links</h2>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : links.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No links uploaded yet. Upload your first link in the Upload tab!
                </div>
              ) : (
                <div className="space-y-3">
                  {links.map((link) => (
                    <Button
                      key={link.id}
                      variant="outline"
                      className="w-full justify-start h-auto py-3 px-4 text-left"
                      onClick={() => handleLinkClick(link.url)}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{link.name}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 truncate w-full">
                          {link.url}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 