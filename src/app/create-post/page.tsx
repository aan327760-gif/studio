"use client";

import { useState, Suspense } from "react";
import { 
  X,
  Mic,
  Avatar,
  AvatarImage,
  AvatarFallback
} from "lucide-react";
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

  const handleSubmit = async () => {
    if (!content.trim() && !imageUrl && !videoUrl && !audioUrl) return;

    setIsSubmitting(true);
    try {
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

      let finalMediaUrl = null;
      let mediaType: "image" | "video" | "audio" | null = null;

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
          textY: textY
        },
        authorId: user?.uid || "anonymous",
        author: {
          name: user?.displayName || "User",
          handle: user?.email?.split('@')[0] || "user",
          avatar: user?.photoURL || "https://picsum.photos/seed/me/100/100"
        },
        likesCount: 0,
        likedBy: [],
        createdAt: serverTimestamp()
      });

      toast({
        title: isRtl ? "تم النشر" : "Posted",
        description: isRtl ? "تم نشر منشورك بنجاح" : "Your post has been published successfully.",
      });
      
      router.push("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Something went wrong during upload.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative overflow-hidden">
      <header className="p-4 flex items-center justify-between sticky top-0 bg-black z-20">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full"><X className="h-6 w-6" /></Button>
        <h1 className="text-sm font-bold opacity-70">New post</h1>
        <Button onClick={handleSubmit} disabled={isSubmitting} className="rounded-full px-6 font-bold bg-white text-black hover:bg-zinc-200">
          {isSubmitting ? "Uploading..." : "Post"}
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto pb-32">
        <div className="p-4 flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.photoURL || ""} />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <Textarea 
            placeholder="Say something..." 
            className="bg-transparent border-none resize-none focus-visible:ring-0 p-0 text-lg min-h-[120px]" 
            value={content} 
            onChange={(e) => setContent(e.target.value)} 
          />
        </div>

        {(imageUrl || videoUrl || audioUrl) && (
          <div className="px-4 pb-6">
            <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 aspect-video w-full">
              {imageUrl && (
                <div className="relative w-full h-full">
                  <img src={imageUrl} alt="Preview" className={cn("w-full h-full object-cover", filterClass)} />
                  {textOverlay && (
                    <div className={cn("absolute", textEffect)} style={{ left: `${textX}%`, top: `${textY}%`, transform: 'translate(-50%, -50%)' }}>
                      <span className={cn("text-xs font-black px-2 py-1 rounded-md", textColor, textBg ? "bg-black/50" : "")}>{textOverlay}</span>
                    </div>
                  )}
                </div>
              )}
              {videoUrl && <video src={videoUrl} className="w-full h-full object-cover" />}
              {audioUrl && <div className="w-full h-full flex flex-col items-center justify-center gap-2"><Mic className="h-10 w-10 text-primary" /><span className="text-xs">Voice clip ready</span></div>}
            </div>
          </div>
        )}
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
