"use client";

import { useState, Suspense } from "react";
import { X, Loader2, Globe, Lock, Ban } from "lucide-react";
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

  const userRef = useMemoFirebase(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<any>(userRef);
  
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isBanned = profile?.isBannedUntil && profile.isBannedUntil.toDate() > new Date();

  const localImageUrl = searchParams.get("image");
  const videoUrl = searchParams.get("video");
  const audioUrl = searchParams.get("audio");
  const filterClass = searchParams.get("filter") || "filter-none";

  const handleSubmit = async () => {
    if (isBanned) {
      toast({
        variant: "destructive",
        title: isRtl ? "أنت محظور" : "Account Restricted",
        description: isRtl ? "تم إيقاف صلاحية النشر مؤقتاً لحسابك." : "Your posting privileges are currently restricted."
      });
      return;
    }

    if (!content.trim() && !localImageUrl && !videoUrl && !audioUrl) return;

    setIsSubmitting(true);
    try {
      let finalMediaUrl = null;
      let mediaType: "image" | "video" | "audio" | null = null;

      try {
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
      } catch (uploadError: any) {
        toast({
          variant: "destructive",
          title: isRtl ? "خطأ في الرفع" : "Upload Error",
          description: uploadError.message,
        });
        setIsSubmitting(false);
        return;
      }

      await addDoc(collection(db, "posts"), {
        content,
        mediaUrl: finalMediaUrl,
        mediaType: mediaType,
        authorId: user?.uid || "anonymous",
        author: {
          name: user?.displayName || "User",
          handle: user?.email?.split('@')[0] || "user",
          avatar: user?.photoURL || "",
          isVerified: user?.email === ADMIN_EMAIL || profile?.isVerified || profile?.role === 'admin',
          role: user?.email === ADMIN_EMAIL ? "admin" : (profile?.role || "user")
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
      <header className="p-4 flex items-center justify-between sticky top-0 bg-black z-20 border-b border-zinc-900">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-zinc-900"><X className="h-6 w-6" /></Button>
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || isBanned || (!content.trim() && !localImageUrl && !videoUrl && !audioUrl)} 
          className="rounded-full px-8 font-black bg-white text-black hover:bg-zinc-200 shadow-xl transition-all active:scale-95 disabled:opacity-20"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (isRtl ? "نشر" : "Post")}
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto pb-32">
        {isBanned && (
          <div className="p-4">
            <Alert variant="destructive" className="bg-red-950/20 border-red-900">
              <Ban className="h-4 w-4" />
              <AlertTitle>{isRtl ? "تنبيه الحظر" : "Account Restriction"}</AlertTitle>
              <AlertDescription>
                {isRtl 
                  ? `أنت محظور من النشر حالياً.`
                  : `You are restricted from posting.`
                }
              </AlertDescription>
            </Alert>
          </div>
        )}

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
              disabled={isBanned}
            />

            {localImageUrl && (
              <div className="relative group rounded-2xl overflow-hidden border border-zinc-800">
                <img src={localImageUrl} alt="Preview" className={cn("w-full h-auto", filterClass)} />
              </div>
            )}
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
