
"use client";

import { useParams, useRouter } from "next/navigation";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useEffect, useState, useRef } from "react";
import { X, Loader2, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function StoryViewerPage() {
  const { storyId } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const storyRef = useMemoFirebase(() => storyId ? doc(db, "stories", storyId as string) : null, [db, storyId]);
  const { data: story, isLoading } = useDoc<any>(storyRef);

  useEffect(() => {
    if (!story) return;

    let duration = 10000; // الافتراضي 10 ثوانٍ للصور
    if (story.mediaType === "video" && videoRef.current) {
      // سيتم تحديث المدة بناءً على الفيديو في حدث onLoadedMetadata
    }

    const interval = 100;
    let timer: NodeJS.Timeout;

    const startTimer = (totalDuration: number) => {
      const step = (interval / totalDuration) * 100;
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            router.back();
            return 100;
          }
          return prev + step;
        });
      }, interval);
    };

    if (story.mediaType === "image") {
      startTimer(10000);
    }

    return () => clearInterval(timer);
  }, [story, router]);

  const handleVideoMetadata = () => {
    if (videoRef.current) {
      const vidDuration = videoRef.current.duration * 1000;
      // تشغيل المؤقت بناءً على مدة الفيديو الحقيقية
      const interval = 100;
      const step = (interval / vidDuration) * 100;
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            router.back();
            return 100;
          }
          return prev + step;
        });
      }, interval);
    }
  };

  if (isLoading) return <div className="h-screen bg-black flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!story) return null;

  return (
    <div className="h-screen bg-black max-w-md mx-auto relative flex flex-col overflow-hidden">
      {/* شريط التقدم */}
      <div className="absolute top-4 left-4 right-4 flex gap-1 z-50">
        <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white transition-all duration-100 ease-linear" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* الرأس */}
      <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-white/20">
            <AvatarImage src={story.authorAvatar} />
            <AvatarFallback>{story.authorName?.[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-black text-white drop-shadow-md">{story.authorName}</span>
            <span className="text-[8px] font-bold text-white/60 uppercase tracking-widest">Sovereign Story</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {story.mediaType === "video" && (
            <Button variant="ghost" size="icon" className="text-white bg-black/20 rounded-full" onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
          )}
          <Button variant="ghost" size="icon" className="text-white bg-black/20 rounded-full" onClick={() => router.back()}>
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* المحتوى */}
      <div className="flex-1 bg-zinc-950 flex items-center justify-center">
        {story.mediaType === "image" ? (
          <img src={story.mediaUrl} alt="Story" className="w-full h-full object-contain" />
        ) : (
          <video 
            ref={videoRef}
            src={story.mediaUrl} 
            className="w-full h-full object-contain" 
            autoPlay 
            muted={isMuted} 
            playsInline 
            onLoadedMetadata={handleVideoMetadata}
          />
        )}
      </div>

      {/* مناطق النقر للتنقل */}
      <div className="absolute inset-0 flex z-40">
        <div className="w-1/3 h-full cursor-pointer" onClick={() => router.back()} />
        <div className="w-2/3 h-full cursor-pointer" onClick={() => router.back()} />
      </div>
    </div>
  );
}
