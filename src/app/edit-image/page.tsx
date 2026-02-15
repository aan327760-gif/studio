
"use client";

import { useState, useEffect, Suspense } from "react";
import { ArrowLeft, RotateCw, Sun, Contrast as ContrastIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { useLanguage } from "@/context/LanguageContext";

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
  const { isRtl } = useLanguage();
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);

  useEffect(() => {
    const imageUrl = searchParams.get("image");
    if (imageUrl) {
      setSelectedImage(imageUrl);
    }
  }, [searchParams]);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDone = () => {
    const params = new URLSearchParams();
    params.set("image", selectedImage || "");
    params.set("filter", activeFilter.class);
    params.set("rotation", rotation.toString());
    params.set("brightness", brightness.toString());
    params.set("contrast", contrast.toString());
    router.push(`/finalize-media?${params.toString()}`);
  };

  if (!selectedImage) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <p>{isRtl ? "لم يتم اختيار صورة" : "No image selected"}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white max-w-md mx-auto relative overflow-hidden">
      <header className="p-4 flex items-center justify-between sticky top-0 z-20 bg-black/50 backdrop-blur-md">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()}
          className="rounded-full text-white hover:bg-white/10"
        >
          <ArrowLeft className={cn("h-6 w-6", isRtl && "rotate-180")} />
        </Button>
        <div className="flex gap-2">
           <Button variant="ghost" size="icon" onClick={handleRotate} className="rounded-full bg-white/5">
              <RotateCw className="h-5 w-5" />
           </Button>
        </div>
        <Button 
          variant="ghost" 
          onClick={handleDone}
          className="text-primary font-black text-lg hover:bg-transparent"
        >
          {isRtl ? "تم" : "Done"}
        </Button>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-full aspect-[3/4] overflow-hidden rounded-3xl transition-all duration-500 shadow-2xl border border-white/5 flex items-center justify-center bg-zinc-950">
          <img 
            src={selectedImage} 
            alt="Preview" 
            className={cn("w-full h-full object-contain transition-all duration-300", activeFilter.class)}
            style={{ 
              transform: `rotate(${rotation}deg)`,
              filter: `brightness(${brightness}%) contrast(${contrast}%) ${activeFilter.class === 'filter-none' ? '' : activeFilter.class === 'grayscale' ? 'grayscale(1)' : activeFilter.class === 'sepia' ? 'sepia(1)' : ''}`
            }}
          />
        </div>
      </main>

      <footer className="p-6 bg-zinc-950 border-t border-zinc-900 space-y-6">
        <div className="space-y-4">
           <div className="flex items-center gap-4">
              <Sun className="h-4 w-4 text-zinc-500" />
              <Slider value={[brightness]} min={50} max={150} step={1} onValueChange={([v]) => setBrightness(v)} className="flex-1" />
           </div>
           <div className="flex items-center gap-4">
              <ContrastIcon className="h-4 w-4 text-zinc-500" />
              <Slider value={[contrast]} min={50} max={150} step={1} onValueChange={([v]) => setContrast(v)} className="flex-1" />
           </div>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {FILTERS.map((filter) => (
            <div 
              key={filter.name} 
              className="flex flex-col items-center gap-2 shrink-0 cursor-pointer"
              onClick={() => setActiveFilter(filter)}
            >
              <div className={cn(
                "w-16 h-16 rounded-xl overflow-hidden border-2 transition-all",
                activeFilter.name === filter.name ? "border-primary scale-110 shadow-lg shadow-primary/20" : "border-transparent opacity-50"
              )}>
                <img 
                  src={selectedImage} 
                  alt={filter.name} 
                  className={cn("w-full h-full object-cover", filter.class)}
                />
              </div>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest transition-colors",
                activeFilter.name === filter.name ? "text-primary" : "text-zinc-600"
              )}>
                {filter.name}
              </span>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}

export default function EditImagePage() {
  return (
    <Suspense fallback={<div className="h-screen bg-black flex items-center justify-center text-white">Loading Editor...</div>}>
      <ImageEditorContent />
    </Suspense>
  );
}
