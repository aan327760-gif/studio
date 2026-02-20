
"use client";

import { useParams, useRouter } from "next/navigation";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useEffect, useState, useRef } from "react";
import { X, Loader2, Volume2, VolumeX, ShieldCheck } from "lucide-react";
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

    let duration = story.mediaType === "image" ? 10000 : 30000; // افتراضي 10 ث للصور، 30 ث للفيديو
    
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
    if (videoRef.current && story?.mediaType === "video") {
      const vidDuration = videoRef.current.duration * 1000;
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
      {/* شريط التقدم السيادي */}
      <div className="absolute top-4 left-4 right-4 flex gap-1.5 z-50">
        <div className="h-[3px] flex-1 bg-white/20 rounded-full overflow-hidden shadow-2xl">
          <div className="h-full bg-white transition-all duration-100 ease-linear shadow-[0_0_10px_#fff]" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* الرأس النخبوي */}
      <div className="absolute top-10 left-4 right-4 flex items-center justify-between z-50 bg-gradient-to-b from-black/60 to-transparent p-4 rounded-3xl backdrop-blur-sm border border-white/5">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl p-0.5 bg-white/10 border border-white/20">
            <Avatar className="h-full w-full rounded-[0.9rem]">
              <AvatarImage src={story.authorAvatar} />
              <AvatarFallback className="bg-zinc-900 font-black">{story.authorName?.[0]}</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-white drop-shadow-lg">{story.authorName}</span>
              <ShieldCheck className="h-3 w-3 text-primary fill-primary" />
            </div>
            <span className="text-[8px] font-black text-white/50 uppercase tracking-[0.3em]">National Story</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {story.mediaType === "video" && (
            <Button variant="ghost" size="icon" className="text-white bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-2xl h-10 w-10 border border-white/10" onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
          )}
          <Button variant="ghost" size="icon" className="text-white bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-2xl h-10 w-10 border border-white/10" onClick={() => router.back()}>
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* المحتوى السينمائي */}
      <div className="flex-1 bg-zinc-950 flex items-center justify-center relative">
        {story.mediaType === "image" ? (
          <img src={story.mediaUrl} alt="Story" className="w-full h-full object-cover" />
        ) : (
          <video 
            ref={videoRef}
            src={story.mediaUrl} 
            className="w-full h-full object-cover" 
            autoPlay 
            muted={isMuted} 
            playsInline 
            onLoadedMetadata={handleVideoMetadata}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
      </div>

      {/* مناطق النقر الذكية للتنقل */}
      <div className="absolute inset-0 flex z-40">
        <div className="w-1/3 h-full cursor-pointer group" onClick={() => router.back()}>
           <div className="h-full w-full opacity-0 group-active:opacity-10 bg-gradient-to-r from-white to-transparent transition-opacity" />
        </div>
        <div className="w-2/3 h-full cursor-pointer group" onClick={() => router.back()}>
           <div className="h-full w-full opacity-0 group-active:opacity-10 bg-gradient-to-l from-white to-transparent transition-opacity" />
        </div>
      </div>
    </div>
  );
}
