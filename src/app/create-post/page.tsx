
"use client";

import { useState, Suspense, useEffect } from "react";
import { X, Loader2, Globe, Lock, Ban, MessageSquare, ShieldCheck, Users } from "lucide-react";
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

  const userRef = useMemoFirebase(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<any>(userRef);
  
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New Settings
  const [privacy, setPrivacy] = useState("public");
  const [allowComments, setAllowComments] = useState(true);

  const isBanned = profile?.isBannedUntil && profile.isBannedUntil.toDate() > new Date();

  // Media Data from Search Params
  const localImageUrl = searchParams.get("image");
  const videoUrl = searchParams.get("video");
  const audioUrl = searchParams.get("audio");
  const filterClass = searchParams.get("filter") || "filter-none";
  const textOverlay = searchParams.get("textOverlay");
  const textColor = searchParams.get("textColor");
  const textBg = searchParams.get("textBg") === "true";
  const textEffect = searchParams.get("textEffect");
  const textX = searchParams.get("textX");
  const textY = searchParams.get("textY");
  const stickersRaw = searchParams.get("stickers");
  const stickers = stickersRaw ? JSON.parse(stickersRaw) : [];

  const handleSubmit = async () => {
    if (isBanned) {
      toast({
        variant: "destructive",
        title: isRtl ? "أنت محظور" : "Account Restricted",
        description: isRtl ? "تم إيقاف صلاحية النشر مؤقتاً لحسابك." : "Your privileges are restricted."
      });
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

      toast({
        title: isRtl ? "تم النشر بنجاح" : "Post Live",
        description: isRtl ? "لقد تمت مشاركة فكرتك بنجاح." : "Your thought has been shared.",
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

      <main className="flex-1 overflow-y-auto pb-32 custom-scrollbar">
        {isBanned && (
          <div className="p-4">
            <Alert variant="destructive" className="bg-red-950/20 border-red-900">
              <Ban className="h-4 w-4" />
              <AlertTitle>{isRtl ? "تنبيه الحظر" : "Account Restriction"}</AlertTitle>
              <AlertDescription>أنت محظور من النشر حالياً.</AlertDescription>
            </Alert>
          </div>
        )}

        <div className="p-4 flex gap-4">
          <Avatar className="h-11 w-11 border border-zinc-800">
            <AvatarImage src={user?.photoURL || ""} />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-6">
            <Textarea 
              placeholder={isRtl ? "ماذا يدور في ذهنك؟" : "What's on your mind?"} 
              className="bg-transparent border-none resize-none focus-visible:ring-0 p-0 text-lg font-medium min-h-[120px] placeholder:text-zinc-700" 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              disabled={isBanned}
            />

            {localImageUrl && (
              <div className="relative group rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900/50">
                <img src={localImageUrl} alt="Preview" className={cn("w-full h-auto", filterClass)} />
                {/* Visual indicator of stickers/text presence */}
                {(textOverlay || stickers.length > 0) && (
                  <div className="absolute top-3 left-3 bg-primary/80 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck className="h-3 w-3" />
                    {isRtl ? "تعديلات سينمائية نشطة" : "Cinema edits active"}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-6 pt-6 border-t border-zinc-900">
               <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">{isRtl ? "إعدادات المنشور" : "Post Settings"}</h3>
               
               <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-900 rounded-2xl">
                  <div className="flex items-center gap-3">
                     <div className="h-10 w-10 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
                        {privacy === 'public' ? <Globe className="h-5 w-5 text-zinc-400" /> : <Users className="h-5 w-5 text-primary" />}
                     </div>
                     <div className="flex flex-col">
                        <span className="text-sm font-bold">{isRtl ? "من يرى هذا؟" : "Who can see this?"}</span>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase">{privacy === 'public' ? (isRtl ? "الجميع" : "Public") : (isRtl ? "المتابعون" : "Followers")}</span>
                     </div>
                  </div>
                  <Select value={privacy} onValueChange={setPrivacy}>
                    <SelectTrigger className="w-[100px] bg-zinc-900 border-zinc-800 rounded-lg h-9 text-xs font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                      <SelectItem value="public">{isRtl ? "العامة" : "Public"}</SelectItem>
                      <SelectItem value="followers">{isRtl ? "المتابعون" : "Followers"}</SelectItem>
                    </SelectContent>
                  </Select>
               </div>

               <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-900 rounded-2xl">
                  <div className="flex items-center gap-3">
                     <div className="h-10 w-10 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
                        <MessageSquare className="h-5 w-5 text-zinc-400" />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-sm font-bold">{isRtl ? "السماح بالتعليقات" : "Allow Comments"}</span>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase">{allowComments ? (isRtl ? "مفتوح" : "Enabled") : (isRtl ? "مغلق" : "Disabled")}</span>
                     </div>
                  </div>
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
