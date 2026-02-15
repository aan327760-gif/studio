
"use client";

import { useState, useRef, Suspense, useEffect } from "react";
import { X, Play, Check, RotateCw, Volume2, VolumeX, Scissors, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/LanguageContext";
import { Slider } from "@/components/ui/slider";

function VideoEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isRtl } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isTooLong, setIsTooLong] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [trimRange, setTrimRange] = useState([0, 100]); // Percentage

  const videoUrl = searchParams.get("video");
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
            title: isRtl ? "فيديو طويل جداً" : "Video too long",
            description: isRtl ? "الحد الأقصى هو 5 دقائق للسيادة الرقمية." : "Max duration is 5 minutes.",
          });
        }
      };
    }
  }, [videoUrl, isRtl]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDone = () => {
    if (isTooLong) {
      toast({ variant: "destructive", title: isRtl ? "خطأ في المدة" : "Duration Error" });
      return;
    }
    const params = new URLSearchParams();
    params.set("video", videoUrl || "");
    params.set("rotation", rotation.toString());
    params.set("muted", isMuted.toString());
    params.set("trimStart", ((trimRange[0] / 100) * duration).toFixed(2));
    params.set("trimEnd", ((trimRange[1] / 100) * duration).toFixed(2));
    router.push(`/finalize-media?${params.toString()}`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!videoUrl) {
    return <div className="h-screen bg-black flex items-center justify-center text-white">No video</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white max-w-md mx-auto relative overflow-hidden">
      <div className="relative flex-1 bg-zinc-950 flex items-center justify-center overflow-hidden">
        <video 
          ref={videoRef}
          src={videoUrl} 
          className="w-full h-full object-contain transition-transform duration-500"
          style={{ transform: `rotate(${rotation}deg)` }}
          muted={isMuted}
          playsInline
          onEnded={() => setIsPlaying(false)}
        />
        
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-black/20"><X className="h-6 w-6" /></Button>
          <div className="flex gap-2">
             <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)} className="rounded-full bg-black/20">
                {isMuted ? <VolumeX className="h-5 w-5 text-red-500" /> : <Volume2 className="h-5 w-5" />}
             </Button>
             <Button variant="ghost" size="icon" onClick={handleRotate} className="rounded-full bg-black/20">
                <RotateCw className="h-5 w-5" />
             </Button>
          </div>
          <Button variant="ghost" size="icon" onClick={handleDone} disabled={isTooLong} className="text-primary font-black"><Check className="h-7 w-7" /></Button>
        </div>

        {!isPlaying && (
          <Button variant="ghost" size="icon" onClick={togglePlay} className="absolute inset-0 m-auto h-20 w-20 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30">
            <Play className="h-10 w-10 fill-white ml-1" />
          </Button>
        )}
      </div>

      <div className="bg-zinc-950 p-6 border-t border-zinc-900 space-y-8">
        <div className="space-y-4">
           <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
              <span>{formatTime((trimRange[0] / 100) * duration)}</span>
              <span className={isTooLong ? "text-red-500" : "text-primary"}>{isTooLong ? "Limit Exceeded" : formatTime(duration)}</span>
              <span>{formatTime((trimRange[1] / 100) * duration)}</span>
           </div>
           <Slider 
             value={trimRange} 
             min={0} max={100} step={1} 
             onValueChange={setTrimRange} 
             className="py-4"
           />
           <p className="text-center text-[9px] font-black text-zinc-700 uppercase tracking-[0.3em]">
              {isRtl ? "اسحب لتحديد المقطع المختار" : "Slide to select duration"}
           </p>
        </div>

        <div className="flex justify-around items-center">
           <div className="flex flex-col items-center gap-2 group cursor-pointer opacity-40">
              <Scissors className="h-5 w-5" />
              <span className="text-[8px] font-black uppercase">{isRtl ? "قص" : "Trim"}</span>
           </div>
           <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => router.back()}>
              <Trash2 className="h-5 w-5 text-red-500" />
              <span className="text-[8px] font-black uppercase text-red-500">{isRtl ? "حذف" : "Discard"}</span>
           </div>
        </div>
      </div>
    </div>
  );
}

export default function EditVideoPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-black flex items-center justify-center text-white">Loading Editor...</div>}>
      <VideoEditorContent />
    </Suspense>
  );
}
