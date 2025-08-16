"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GalleryUploader from "./GalleryUploader";
import LinksManager from "./LinksManager";

export default function MainTabs() {
  return (
    <div className="w-full px-4 py-6 flex flex-col items-center bg-white dark:bg-black">
      <div className="w-full max-w-6xl">
        <Tabs defaultValue="gallery" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="links">Links</TabsTrigger>
          </TabsList>
          
          <TabsContent value="gallery" className="mt-0">
            <GalleryUploader />
          </TabsContent>
          
          <TabsContent value="links" className="mt-0">
            <LinksManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 