
"use client";

import { useState, Suspense } from "react";
import { 
  ArrowLeft, 
  Smile, 
  Type, 
  Sparkles, 
  Music, 
  FastForward, 
  Layers, 
  Grid2X2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

function FinalizeMediaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const imageUrl = searchParams.get("image");
  const videoUrl = searchParams.get("video");

  const handleNext = () => {
    router.push("/create-post");
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white max-w-md mx-auto relative overflow-hidden">
      {/* Background Media */}
      <div className="absolute inset-0 z-0">
        {imageUrl && (
          <img src={imageUrl} alt="Finalize" className="w-full h-full object-cover" />
        )}
        {videoUrl && (
          <video 
            src={videoUrl} 
            className="w-full h-full object-cover" 
            autoPlay 
            muted 
            loop 
            playsInline
          />
        )}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 p-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()}
          className="rounded-full text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-7 w-7" />
        </Button>
      </header>

      {/* Left Sidebar Actions */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-4 gap-7">
        {[
          { icon: Smile, label: "Stickers" },
          { icon: Type, label: "Text" },
          { icon: Sparkles, label: "Effects" },
          { icon: Music, label: "Music" },
          { icon: FastForward, label: "Time" },
          { icon: Layers, label: "Filters" },
          { icon: Grid2X2, label: "Blur" },
        ].map((action) => (
          <div key={action.label} className="flex items-center gap-4 group cursor-pointer w-fit">
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md group-hover:bg-black/40 transition-colors shadow-sm">
              <action.icon className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm font-semibold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
              {action.label}
            </span>
          </div>
        ))}
      </div>

      {/* Bottom Right Next Button */}
      <div className="relative z-10 p-6 flex justify-end">
        <Button 
          onClick={handleNext}
          className="rounded-full bg-white text-black hover:bg-zinc-200 px-10 py-7 text-lg font-bold shadow-2xl transition-transform active:scale-95"
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export default function FinalizeMediaPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-black flex items-center justify-center text-white">Loading...</div>}>
      <FinalizeMediaContent />
    </Suspense>
  );
}
