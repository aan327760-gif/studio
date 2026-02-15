
"use client";

import { useState, Suspense, useRef, useEffect } from "react";
import { X, Loader2, Globe, Plus, ImageIcon } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userRef = useMemoFirebase(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<any>(userRef);
  
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [privacy, setPrivacy] = useState("public");
  const [allowComments, setAllowComments] = useState(true);

  const [localImages, setLocalImages] = useState<string[]>([]);
  const videoUrlFromParams = searchParams.get("video");
  const source = searchParams.get("source");

  useEffect(() => {
    if (source === 'album') {
      const stored = sessionStorage.getItem('pending_album_images');
      if (stored) {
        setLocalImages(JSON.parse(stored));
        sessionStorage.removeItem('pending_album_images');
      }
    } else {
      const initialImageUrl = searchParams.get("image");
      if (initialImageUrl) setLocalImages([initialImageUrl]);
    }
  }, [source, searchParams]);

  const isBanned = profile?.isBannedUntil && profile.isBannedUntil.toDate() > new Date();

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setLocalImages(prev => [...prev, ...newImages].slice(0, 4));
    }
  };

  const removeImage = (index: number) => {
    setLocalImages(prev => prev.filter((_, i) => i !== index));
  };

  const processPostInBackground = async (
    postContent: string, 
    images: string[], 
    video: string | null, 
    authorInfo: any
  ) => {
    try {
      let finalMediaUrls: string[] = [];
      let mediaType: "image" | "video" | "audio" | "album" | null = null;

      if (images.length > 0) {
        const uploadPromises = images.map(async (url) => {
          const base64 = url.startsWith('data:') ? url : await urlToBlob(url);
          return uploadToCloudinary(base64, 'image');
        });
        finalMediaUrls = await Promise.all(uploadPromises);
        mediaType = finalMediaUrls.length > 1 ? 'album' : 'image';
      } else if (video) {
        const base64 = await urlToBlob(video);
        const url = await uploadToCloudinary(base64, 'video');
        finalMediaUrls = [url];
        mediaType = 'video';
      }

      await addDoc(collection(db, "posts"), {
        content: postContent,
        mediaUrl: finalMediaUrls[0] || null,
        mediaUrls: finalMediaUrls,
        mediaType: mediaType,
        authorId: user?.uid || "anonymous",
        author: authorInfo,
        likesCount: 0,
        likedBy: [],
        savesCount: 0,
        savedBy: [],
        commentsCount: 0,
        createdAt: serverTimestamp(),
        privacy,
        allowComments
      });

      toast({ 
        title: isRtl ? "تم النشر بنجاح" : "Post Published Successfully"
      });
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: isRtl ? "فشل النشر" : "Post Failed", 
        description: error.message 
      });
    }
  };

  const handleSubmit = () => {
    if (isBanned) {
      toast({ variant: "destructive", title: isRtl ? "أنت محظور" : "Account Restricted" });
      return;
    }

    if (!content.trim() && localImages.length === 0 && !videoUrlFromParams) return;

    setIsSubmitting(true);
    
    const authorInfo = {
      name: profile?.displayName || user?.displayName || "User",
      handle: user?.email?.split('@')[0] || "user",
      avatar: profile?.photoURL || user?.photoURL || "",
      isVerified: user?.email === ADMIN_EMAIL || profile?.isVerified || profile?.role === 'admin',
      isPro: profile?.isPro || false,
      role: user?.email === ADMIN_EMAIL ? "admin" : (profile?.role || "user")
    };

    processPostInBackground(content, [...localImages], videoUrlFromParams, authorInfo);

    toast({ 
      title: isRtl ? "جاري النشر في الخلفية..." : "Posting in background...",
      description: isRtl ? "يمكنك الاستمرار في التصفح بحرية." : "You can keep browsing freely."
    });
    router.push("/");
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative overflow-x-hidden">
      <header className="p-4 flex items-center justify-between sticky top-0 bg-black z-20 border-b border-zinc-900">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-zinc-900">
          <X className="h-6 w-6" />
        </Button>
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Draft Sovereign</span>
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || isBanned || (!content.trim() && localImages.length === 0 && !videoUrlFromParams)} 
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
          <div className="flex-1 min-w-0">
            <Textarea 
              placeholder={isRtl ? "شارك فكرة حرة أو ألبوماً..." : "Share a free thought or album..."} 
              className="bg-transparent border-none resize-none focus-visible:ring-0 p-0 text-lg font-medium min-h-[120px] mb-4" 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
            />

            {localImages.length > 0 && (
              <div className="w-full overflow-hidden mb-6 px-1">
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 snap-x max-w-full">
                  {localImages.map((img, i) => (
                    <div key={i} className="relative h-32 w-32 shrink-0 rounded-2xl overflow-hidden border border-zinc-800 group snap-center">
                      <img src={img} alt="preview" className="w-full h-full object-cover" />
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 hover:bg-red-600 border-none"
                        onClick={() => removeImage(i)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {localImages.length < 4 && (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="h-32 w-32 shrink-0 rounded-2xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center gap-2 hover:bg-zinc-900 transition-colors snap-center"
                    >
                      <Plus className="h-6 w-6 text-zinc-500" />
                      <span className="text-[8px] font-black text-zinc-600 uppercase">Add</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {!videoUrlFromParams && localImages.length === 0 && (
              <div className="flex gap-4 py-4 border-t border-zinc-900">
                 <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors">
                    <ImageIcon className="h-5 w-5" />
                    <span className="text-xs font-black uppercase tracking-widest">{isRtl ? "أضف صور" : "Add Images"}</span>
                 </button>
              </div>
            )}

            <input type="file" accept="image/*" multiple className="hidden" ref={fileInputRef} onChange={handleAddImage} />

            {videoUrlFromParams && (
              <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border border-zinc-800 bg-zinc-900 mb-6 w-full shadow-2xl">
                <video src={videoUrlFromParams} className="w-full h-full object-contain" autoPlay muted loop />
              </div>
            )}

            <div className="space-y-4 pt-6 border-t border-zinc-900">
               <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-900 rounded-[2rem]">
                  <div className="flex items-center gap-3">
                     <Globe className="h-5 w-5 text-zinc-400" />
                     <span className="text-sm font-bold">{isRtl ? "الجمهور" : "Audience"}</span>
                  </div>
                  <Select value={privacy} onValueChange={setPrivacy}>
                    <SelectTrigger className="w-[100px] bg-zinc-900 border-none h-8 text-xs font-bold shadow-none"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                      <SelectItem value="public">{isRtl ? "عام" : "Public"}</SelectItem>
                      <SelectItem value="followers">{isRtl ? "متابعون" : "Followers"}</SelectItem>
                    </SelectContent>
                  </Select>
               </div>
               <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-900 rounded-[2rem]">
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
