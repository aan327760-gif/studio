
"use client";

import { useState, useRef, Suspense, useEffect } from "react";
import { X, Play, Check, RotateCw, Scissors, Trash2, Columns2, Square, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";

function VideoEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isTooLong, setIsTooLong] = useState(false);
  const videoUrl = searchParams.get("video");

  // الحد الأقصى: 5 دقائق (300 ثانية)
  const MAX_DURATION = 300;

  useEffect(() => {
    if (videoRef.current && videoUrl) {
      videoRef.current.onloadedmetadata = () => {
        const videoDuration = videoRef.current?.duration || 0;
        setDuration(videoDuration);
        if (videoDuration > MAX_DURATION) {
          setIsTooLong(true);
          toast({
            variant: "destructive",
            title: "فيديو طويل جداً",
            description: "عذراً يا زعيم، الفيديوهات يجب ألا تتجاوز 5 دقائق.",
          });
        }
      };
    }
  }, [videoUrl]);

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
    if (isTooLong) {
      toast({
        variant: "destructive",
        title: "خطأ في المدة",
        description: "يرجى اختيار فيديو أقصر من 5 دقائق للمتابعة.",
      });
      return;
    }
    router.push(`/finalize-media?video=${encodeURIComponent(videoUrl || "")}`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
          className="w-full h-full object-contain"
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
            disabled={isTooLong}
            className={cn("rounded-full text-white hover:bg-white/10", isTooLong && "opacity-20")}
          >
            <Check className="h-7 w-7" />
          </Button>
        </div>

        {isTooLong && (
          <div className="absolute bottom-20 left-4 right-4 z-20">
            <Alert variant="destructive" className="bg-red-950/90 border-red-500 backdrop-blur-md">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>الفيديو طويل جداً</AlertTitle>
              <AlertDescription>
                مدة هذا الفيديو ({formatTime(duration)}) تتجاوز الحد المسموح به وهو 5 دقائق.
              </AlertDescription>
            </Alert>
          </div>
        )}

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
          <div className="flex flex-col items-center gap-2 group cursor-pointer opacity-40">
            <RotateCw className="h-6 w-6 text-white" />
            <span className="text-[10px] text-zinc-400">تدوير</span>
          </div>
          <div className="flex flex-col items-center gap-2 group cursor-pointer opacity-40">
            <Columns2 className="h-6 w-6 text-white" />
            <span className="text-[10px] text-zinc-400">تقسيم</span>
          </div>
          <div className="flex flex-col items-center gap-2 group cursor-pointer">
            <Scissors className="h-6 w-6 text-white group-hover:text-primary" />
            <span className="text-[10px] text-zinc-400">قص</span>
          </div>
          <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => router.back()}>
            <Trash2 className="h-6 w-6 text-red-500 group-hover:text-red-400" />
            <span className="text-[10px] text-zinc-400">حذف</span>
          </div>
        </div>

        {/* Timeline Mockup */}
        <div className="relative mt-4">
          <div className="flex justify-between text-[10px] text-zinc-500 mb-2 font-mono uppercase tracking-widest">
            <span>0:00.0</span>
            <span className={isTooLong ? "text-red-500 font-bold" : ""}>{formatTime(duration)}</span>
          </div>
          <div className={cn(
            "h-12 bg-zinc-900 rounded-lg border-2 flex items-center px-1 relative overflow-hidden transition-colors",
            isTooLong ? "border-red-500" : "border-white"
          )}>
            <div className={cn("absolute left-0 w-1 h-full z-10 rounded-l-md", isTooLong ? "bg-red-500" : "bg-white")} />
            <div className="flex gap-0.5 opacity-20 h-full w-full">
               {Array.from({ length: 40 }).map((_, i) => (
                 <div key={i} className="flex-1 bg-zinc-600 h-full" />
               ))}
            </div>
            <div className="absolute bottom-1 right-2 bg-black/80 text-[8px] px-1.5 py-0.5 rounded text-white font-mono border border-white/10">
              {formatTime(duration)}
            </div>
          </div>
          <div className="flex justify-center mt-2">
             <div className={cn("w-0.5 h-4", isTooLong ? "bg-red-500" : "bg-white")} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditVideoPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-black flex items-center justify-center text-white">جاري تحميل المحرر...</div>}>
      <VideoEditorContent />
    </Suspense>
  );
}
