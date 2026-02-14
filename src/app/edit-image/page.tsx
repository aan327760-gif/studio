
"use client";

import { useState, useEffect, Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const FILTERS = [
  { name: "No Filter", class: "filter-none" },
  { name: "B&W", class: "grayscale" },
  { name: "Sepia", class: "sepia" },
  { name: "Contrast", class: "contrast-150" },
  { name: "Vintage", class: "sepia-[0.5] hue-rotate-[-30deg] saturate-[1.2] contrast-[0.8]" },
  { name: "Brighten", class: "brightness-125" },
];

function ImageEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);

  useEffect(() => {
    const imageUrl = searchParams.get("image");
    if (imageUrl) {
      setSelectedImage(imageUrl);
    }
  }, [searchParams]);

  const handleDone = () => {
    const params = new URLSearchParams();
    params.set("image", selectedImage || "");
    params.set("filter", activeFilter.class);
    router.push(`/finalize-media?${params.toString()}`);
  };

  if (!selectedImage) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <p>No image selected</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white max-w-md mx-auto relative overflow-hidden">
      {/* Header */}
      <header className="p-4 flex items-center justify-between sticky top-0 z-20 bg-black/50 backdrop-blur-md">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()}
          className="rounded-full text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <Button 
          variant="ghost" 
          onClick={handleDone}
          className="text-primary font-bold text-lg hover:bg-transparent"
        >
          Done
        </Button>
      </header>

      {/* Main Preview */}
      <main className="flex-1 flex items-center justify-center p-2">
        <div className={cn("relative w-full aspect-[3/4] overflow-hidden rounded-lg transition-all duration-300", activeFilter.class)}>
          <img 
            src={selectedImage} 
            alt="Preview" 
            className="w-full h-full object-cover"
          />
        </div>
      </main>

      {/* Filters Section */}
      <footer className="p-6 bg-black">
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
          {FILTERS.map((filter) => (
            <div 
              key={filter.name} 
              className="flex flex-col items-center gap-2 shrink-0 cursor-pointer"
              onClick={() => setActiveFilter(filter)}
            >
              <span className={cn(
                "text-[10px] font-medium transition-colors",
                activeFilter.name === filter.name ? "text-white" : "text-zinc-500"
              )}>
                {filter.name}
              </span>
              <div className={cn(
                "w-16 h-16 rounded-md overflow-hidden border-2 transition-all",
                activeFilter.name === filter.name ? "border-primary scale-105" : "border-transparent opacity-70"
              )}>
                <img 
                  src={selectedImage} 
                  alt={filter.name} 
                  className={cn("w-full h-full object-cover", filter.class)}
                />
              </div>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}

export default function EditImagePage() {
  return (
    <Suspense fallback={<div className="h-screen bg-black flex items-center justify-center text-white">Loading...</div>}>
      <ImageEditorContent />
    </Suspense>
  );
}
