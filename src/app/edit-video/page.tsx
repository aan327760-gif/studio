
"use client";

import { useState, useRef, Suspense } from "react";
import { X, Play, Check, RotateCw, Scissors, Trash2, Columns2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

function VideoEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoUrl = searchParams.get("video");

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDone = () => {
    router.push(`/finalize-media?video=${encodeURIComponent(videoUrl || "")}`);
  };

  if (!videoUrl) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <p>No video selected</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white max-w-md mx-auto relative overflow-hidden">
      {/* Video Preview Container */}
      <div className="relative flex-1 bg-zinc-900 flex items-center justify-center">
        <video 
          ref={videoRef}
          src={videoUrl} 
          className="w-full h-full object-cover"
          onEnded={() => setIsPlaying(false)}
          playsInline
        />
        
        {/* Top Overlay Controls */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
            className="rounded-full text-white hover:bg-white/10"
          >
            <X className="h-7 w-7" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={togglePlay}
            className="rounded-full text-white bg-black/20 backdrop-blur-sm"
          >
            <Play className={cn("h-8 w-8 fill-white", isPlaying && "opacity-0")} />
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleDone}
            className="rounded-full text-white hover:bg-white/10"
          >
            <Check className="h-7 w-7" />
          </Button>
        </div>

        {/* Bottom Right Fullscreen/Crop Icon */}
        <div className="absolute bottom-4 right-4 z-10">
          <Button variant="ghost" size="icon" className="text-white bg-black/40 rounded-lg h-10 w-10">
            <Square className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Toolbar Section */}
      <div className="bg-black py-8 px-4 border-t border-zinc-900">
        <div className="flex justify-around items-center mb-8">
          <div className="flex flex-col items-center gap-2 group cursor-pointer">
            <RotateCw className="h-6 w-6 text-white group-hover:text-zinc-400" />
            <span className="text-[10px] text-zinc-400">Rotate</span>
          </div>
          <div className="flex flex-col items-center gap-2 group cursor-pointer">
            <Columns2 className="h-6 w-6 text-white group-hover:text-zinc-400" />
            <span className="text-[10px] text-zinc-400">Split</span>
          </div>
          <div className="flex flex-col items-center gap-2 group cursor-pointer">
            <Scissors className="h-6 w-6 text-white group-hover:text-zinc-400" />
            <span className="text-[10px] text-zinc-400">Trim</span>
          </div>
          <div className="flex flex-col items-center gap-2 group cursor-pointer">
            <Trash2 className="h-6 w-6 text-white group-hover:text-zinc-400" />
            <span className="text-[10px] text-zinc-400">Delete</span>
          </div>
        </div>

        {/* Timeline Mockup */}
        <div className="relative mt-4">
          <div className="flex justify-between text-[10px] text-zinc-500 mb-2 font-mono">
            <span>0:00.0</span>
            <span>0:29.5</span>
          </div>
          <div className="h-12 bg-zinc-800 rounded-lg border-2 border-white flex items-center px-1 relative overflow-hidden">
            <div className="absolute left-0 w-1 h-full bg-white z-10 rounded-l-md" />
            <div className="flex gap-0.5 opacity-50 h-full w-full">
               {Array.from({ length: 30 }).map((_, i) => (
                 <div key={i} className="flex-1 bg-zinc-600 h-full" />
               ))}
            </div>
            <div className="absolute bottom-1 right-2 bg-black/80 text-[8px] px-1 rounded text-white font-mono">
              0:29.5
            </div>
          </div>
          <div className="flex justify-center mt-2">
             <div className="w-0.5 h-4 bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditVideoPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-black flex items-center justify-center text-white">Loading...</div>}>
      <VideoEditorContent />
    </Suspense>
  );
}
