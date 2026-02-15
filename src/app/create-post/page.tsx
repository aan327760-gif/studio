
"use client";

import { useState, Suspense } from "react";
import { X, Mic, Loader2, Sparkles, Globe, Lock } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { moderateContent } from "@/ai/flows/content-moderation-assistant";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useFirestore, useUser } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { uploadToCloudinary } from "@/lib/cloudinary";

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
  
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const imageUrl = searchParams.get("image");
  const videoUrl = searchParams.get("video");
  const audioUrl = searchParams.get("audio");
  const filterClass = searchParams.get("filter") || "filter-none";
  const textOverlay = searchParams.get("textOverlay") || "";
  const textColor = searchParams.get("textColor") || "text-white";
  const textBg = searchParams.get("textBg") === "true";
  const textEffect = searchParams.get("textEffect") || "";
  const textX = parseFloat(searchParams.get("textX") || "50");
  const textY = parseFloat(searchParams.get("textY") || "50");
  const stickersRaw = searchParams.get("stickers");
  const stickers = stickersRaw ? JSON.parse(stickersRaw) : [];

  const handleSubmit = async () => {
    if (!content.trim() && !imageUrl && !videoUrl && !audioUrl) return;

    setIsSubmitting(true);
    try {
      // 1. فحص المحتوى
      const moderationResult = await moderateContent({ text: content || "Media Post" });
      
      if (!moderationResult.isAppropriate) {
        toast({
          title: isRtl ? "محتوى غير لائق" : "Inappropriate Content",
          description: moderationResult.reasoning,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // 2. الرفع إلى Cloudinary
      let finalMediaUrl = null;
      let mediaType: "image" | "video" | "audio" | null = null;

      try {
        if (imageUrl) {
          const base64 = await urlToBlob(imageUrl);
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
      } catch (uploadError: any) {
        // التعامل مع خطأ الإعدادات بشكل لبق
        toast({
          variant: "destructive",
          title: isRtl ? "خطأ في الرفع" : "Upload Error",
          description: uploadError.message,
        });
        setIsSubmitting(false);
        return;
      }

      // 3. الحفظ في Firestore
      await addDoc(collection(db, "posts"), {
        content,
        mediaUrl: finalMediaUrl,
        mediaType: mediaType,
        mediaSettings: {
          filter: filterClass,
          textOverlay: textOverlay,
          textColor: textColor,
          textBg: textBg,
          textEffect: textEffect,
          textX: textX,
          textY: textY,
          stickers: stickers
        },
        authorId: user?.uid || "anonymous",
        author: {
          name: user?.displayName || "User",
          handle: user?.email?.split('@')[0] || "user",
          avatar: user?.photoURL || ""
        },
        likesCount: 0,
        likedBy: [],
        createdAt: serverTimestamp()
      });

      toast({
        title: isRtl ? "تم النشر بنجاح" : "Success",
        description: isRtl ? "منشورك الآن متاح للجميع" : "Your post is now live.",
      });
      
      router.push("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create post.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative overflow-hidden">
      {isSubmitting && (
        <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-6 animate-in fade-in duration-300">
           <div className="relative">
             <div className="h-20 w-20 rounded-full border-t-2 border-primary animate-spin" />
             <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-primary animate-pulse" />
           </div>
           <div className="text-center space-y-1">
             <h3 className="text-xl font-black">{isRtl ? "جاري النشر..." : "Publishing..."}</h3>
             <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em]">{isRtl ? "تحميل الوسائط وتأمين البيانات" : "Uploading media & securing data"}</p>
           </div>
        </div>
      )}

      <header className="p-4 flex items-center justify-between sticky top-0 bg-black z-20 border-b border-zinc-900">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-zinc-900"><X className="h-6 w-6" /></Button>
        <div className="flex items-center gap-2">
           <div className="flex items-center gap-1 bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">
              <Globe className="h-3 w-3 text-zinc-500" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{isRtl ? "عام" : "Public"}</span>
           </div>
        </div>
        <Button onClick={handleSubmit} disabled={isSubmitting || (!content.trim() && !imageUrl && !videoUrl && !audioUrl)} className="rounded-full px-8 font-black bg-white text-black hover:bg-zinc-200 shadow-xl transition-all active:scale-95 disabled:opacity-20">
          {isRtl ? "نشر" : "Post"}
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto pb-32">
        <div className="p-4 flex gap-4">
          <Avatar className="h-11 w-11 border border-zinc-800">
            <AvatarImage src={user?.photoURL || ""} />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-4">
            <Textarea 
              placeholder={isRtl ? "ماذا يدور في ذهنك؟" : "What's on your mind?"} 
              className="bg-transparent border-none resize-none focus-visible:ring-0 p-0 text-lg font-medium min-h-[140px] placeholder:text-zinc-700" 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
            />
            
            {(imageUrl || videoUrl || audioUrl) && (
              <div className="relative group">
                <div className="relative rounded-[2.5rem] overflow-hidden border border-zinc-800 bg-zinc-900 aspect-video w-full shadow-2xl">
                  {imageUrl && (
                    <div className="relative w-full h-full">
                      <img src={imageUrl} alt="Preview" className={cn("w-full h-full object-cover", filterClass)} />
                      {textOverlay && (
                        <div className={cn("absolute", textEffect)} style={{ left: `${textX}%`, top: `${textY}%`, transform: 'translate(-50%, -50%)' }}>
                          <span className={cn("text-lg font-black px-3 py-1.5 rounded-xl shadow-2xl", textColor, textBg ? "bg-black/60 backdrop-blur-md" : "")}>{textOverlay}</span>
                        </div>
                      )}
                      {stickers.map((s: any) => (
                        <div 
                          key={s.id} 
                          className="absolute" 
                          style={{ 
                            left: `${s.x}%`, 
                            top: `${s.y}%`, 
                            transform: `translate(-50%, -50%) scale(${s.scale * 0.5}) rotate(${s.rotation}deg)` 
                          }}
                        >
                          <img src={s.imageUrl} className="w-20 h-20 object-contain drop-shadow-2xl" alt="Sticker" />
                        </div>
                      ))}
                    </div>
                  )}
                  {videoUrl && <video src={videoUrl} className="w-full h-full object-cover" autoPlay muted loop />}
                  {audioUrl && (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-zinc-950">
                      <div className="h-16 w-16 bg-primary/20 rounded-full flex items-center justify-center text-primary animate-pulse">
                        <Mic className="h-8 w-8" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{isRtl ? "مقطع صوتي جاهز" : "Voice clip ready"}</p>
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-red-500 text-white shadow-xl hover:bg-red-600 border-2 border-black">
                   <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="p-4 border-t border-zinc-900 bg-black/50 backdrop-blur-md sticky bottom-0">
         <div className="flex items-center gap-4 text-zinc-500">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-900 bg-zinc-950">
               <Lock className="h-3 w-3" />
               <span className="text-[9px] font-bold uppercase tracking-wider">{isRtl ? "مشفر تماماً" : "Fully Encrypted"}</span>
            </div>
         </div>
      </footer>
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
