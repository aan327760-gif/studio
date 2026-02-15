
"use client";

import { useState, Suspense, useEffect, useRef } from "react";
import { X, Loader2, Globe, Lock, Ban, MessageSquare, ShieldCheck, Users, Mic, Play, Pause, Volume2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, doc } from "firebase/firestore";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ADMIN_EMAIL = "adelbenmaza3@gmail.com";

async function urlToBlob(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function CreatePostContent() {
  const { isRtl } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const db = useFirestore();
  const { user } = useUser();
  const audioRef = useRef<HTMLAudioElement>(null);

  const userRef = useMemoFirebase(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<any>(userRef);
  
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  const [privacy, setPrivacy] = useState("public");
  const [allowComments, setAllowComments] = useState(true);

  const isBanned = profile?.isBannedUntil && profile.isBannedUntil.toDate() > new Date();

  // Media Data from Search Params
  const localImageUrl = searchParams.get("image");
  const videoUrl = searchParams.get("video");
  const audioUrl = searchParams.get("audio");
  const filterClass = searchParams.get("filter") || "filter-none";
  const rotation = searchParams.get("rotation") || "0";
  const brightness = searchParams.get("brightness") || "100";
  const contrast = searchParams.get("contrast") || "100";
  const isMuted = searchParams.get("muted") === "true";
  const textOverlay = searchParams.get("textOverlay");
  const textColor = searchParams.get("textColor");
  const textBg = searchParams.get("textBg") === "true";
  const textEffect = searchParams.get("textEffect");
  const textX = searchParams.get("textX");
  const textY = searchParams.get("textY");
  const stickersRaw = searchParams.get("stickers");
  const stickers = stickersRaw ? JSON.parse(stickersRaw) : [];

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlayingAudio) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlayingAudio(!isPlayingAudio);
    }
  };

  const handleSubmit = async () => {
    if (isBanned) {
      toast({ variant: "destructive", title: isRtl ? "أنت محظور" : "Account Restricted" });
      return;
    }

    if (!content.trim() && !localImageUrl && !videoUrl && !audioUrl) return;

    setIsSubmitting(true);
    try {
      let finalMediaUrl = null;
      let mediaType: "image" | "video" | "audio" | null = null;

      if (localImageUrl) {
        const base64 = localImageUrl.startsWith('data:') ? localImageUrl : await urlToBlob(localImageUrl);
        finalMediaUrl = await uploadToCloudinary(base64, 'image');
        mediaType = 'image';
      } else if (videoUrl) {
        const base64 = await urlToBlob(videoUrl);
        finalMediaUrl = await uploadToCloudinary(base64, 'video');
        mediaType = 'video';
      } else if (audioUrl) {
        const base64 = await urlToBlob(audioUrl);
        finalMediaUrl = await uploadToCloudinary(base64, 'raw');
        mediaType = 'audio';
      }

      const mediaSettings = {
        filter: filterClass,
        rotation,
        brightness,
        contrast,
        muted: isMuted,
        textOverlay,
        textColor,
        textBg,
        textEffect,
        textX,
        textY,
        stickers
      };

      await addDoc(collection(db, "posts"), {
        content,
        mediaUrl: finalMediaUrl,
        mediaType: mediaType,
        authorId: user?.uid || "anonymous",
        author: {
          name: profile?.displayName || user?.displayName || "User",
          handle: user?.email?.split('@')[0] || "user",
          avatar: profile?.photoURL || user?.photoURL || "",
          isVerified: user?.email === ADMIN_EMAIL || profile?.isVerified || profile?.role === 'admin',
          isPro: profile?.isPro || false,
          role: user?.email === ADMIN_EMAIL ? "admin" : (profile?.role || "user")
        },
        likesCount: 0,
        likedBy: [],
        createdAt: serverTimestamp(),
        mediaSettings,
        privacy,
        allowComments
      });

      toast({ title: isRtl ? "تم النشر بنجاح" : "Post Live" });
      router.push("/");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative overflow-hidden">
      <header className="p-4 flex items-center justify-between sticky top-0 bg-black z-20 border-b border-zinc-900">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-zinc-900"><X className="h-6 w-6" /></Button>
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || isBanned || (!content.trim() && !localImageUrl && !videoUrl && !audioUrl)} 
          className="rounded-full px-8 font-black bg-white text-black hover:bg-zinc-200"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (isRtl ? "نشر" : "Post")}
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto pb-32 custom-scrollbar p-4">
        <div className="flex gap-4">
          <Avatar className="h-11 w-11 border border-zinc-800">
            <AvatarImage src={user?.photoURL || ""} />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-6">
            <Textarea 
              placeholder={isRtl ? "أضف تعليقاً على هذا العمل..." : "Add a caption..."} 
              className="bg-transparent border-none resize-none focus-visible:ring-0 p-0 text-lg font-medium min-h-[80px]" 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
            />

            {(localImageUrl || videoUrl) && (
              <div className="relative group rounded-[2rem] overflow-hidden border border-zinc-800 bg-zinc-900/50 aspect-square flex items-center justify-center">
                {localImageUrl ? (
                  <img 
                    src={localImageUrl} 
                    alt="Preview" 
                    className={cn("w-full h-full object-cover transition-all", filterClass)} 
                    style={{ transform: `rotate(${rotation}deg)`, filter: `brightness(${brightness}%) contrast(${contrast}%) ${filterClass === 'filter-none' ? '' : filterClass === 'grayscale' ? 'grayscale(1)' : ''}` }}
                  />
                ) : (
                  <video src={videoUrl!} className="w-full h-full object-cover" style={{ transform: `rotate(${rotation}deg)` }} muted={isMuted} loop autoPlay playsInline />
                )}
                <div className="absolute top-3 right-3 bg-primary px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                   {isRtl ? "تمت المعالجة" : "Processed"}
                </div>
              </div>
            )}

            {audioUrl && (
              <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-[2rem] flex flex-col gap-4 shadow-xl">
                <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlayingAudio(false)} className="hidden" />
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-primary text-white hover:bg-primary/90 shadow-lg" onClick={toggleAudio}>
                    {isPlayingAudio ? <Pause className="h-6 w-6 fill-white" /> : <Play className="h-6 w-6 fill-white" />}
                  </Button>
                  <div className="flex-1 space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">{isRtl ? "معاينة البصمة الصوتية" : "Voice Note Preview"}</p>
                    <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                      <div className={cn("h-full bg-primary transition-all duration-300", isPlayingAudio ? "w-full" : "w-0")} />
                    </div>
                  </div>
                  <Volume2 className="h-5 w-5 text-zinc-700" />
                </div>
              </div>
            )}

            <div className="space-y-6 pt-6 border-t border-zinc-900">
               <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-900 rounded-2xl">
                  <div className="flex items-center gap-3">
                     <Globe className="h-5 w-5 text-zinc-400" />
                     <span className="text-sm font-bold">{isRtl ? "الجمهور" : "Audience"}</span>
                  </div>
                  <Select value={privacy} onValueChange={setPrivacy}>
                    <SelectTrigger className="w-[100px] bg-zinc-900 border-none h-8 text-xs font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                      <SelectItem value="public">{isRtl ? "عام" : "Public"}</SelectItem>
                      <SelectItem value="followers">{isRtl ? "متابعون" : "Followers"}</SelectItem>
                    </SelectContent>
                  </Select>
               </div>
               <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-900 rounded-2xl">
                  <span className="text-sm font-bold">{isRtl ? "السماح بالتعليق" : "Allow Comments"}</span>
                  <Switch checked={allowComments} onCheckedChange={setAllowComments} />
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CreatePostPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-black flex items-center justify-center text-white">Loading...</div>}>
      <CreatePostContent />
    </Suspense>
  );
}
