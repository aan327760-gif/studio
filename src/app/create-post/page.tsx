
"use client";

import { useState, Suspense, useRef, useEffect } from "react";
import { X, Plus, ImageIcon, Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Switch } from "@/components/ui/switch";
import { useUpload } from "@/context/UploadContext";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ADMIN_EMAIL = "adelbenmaza3@gmail.com";

/**
 * دالة ضغط الصور سيادياً لتقليل الحجم قبل الرفع.
 */
const compressImage = async (url: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1200;
      let width = img.width;
      let height = img.height;

      if (width > MAX_WIDTH) {
        height = (MAX_WIDTH / width) * height;
        width = MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7)); // جودة 70% توازن ممتاز
    };
    img.onerror = () => resolve(url);
  });
};

function CreatePostContent() {
  const { isRtl } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const db = useFirestore();
  const { user } = useUser();
  const { startUpload } = useUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userRef = useMemoFirebase(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<any>(userRef);
  
  const [content, setContent] = useState("");
  const [privacy, setPrivacy] = useState("public");
  const [allowComments, setAllowComments] = useState(true);
  const [localImages, setLocalImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
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

  const handleSubmit = async () => {
    if (isBanned) {
      toast({ variant: "destructive", title: isRtl ? "أنت محظور" : "Account Restricted" });
      return;
    }

    if (!content.trim() && localImages.length === 0 && !videoUrlFromParams) return;

    setIsProcessing(true);

    const authorInfo = {
      name: profile?.displayName || user?.displayName || "User",
      handle: user?.email?.split('@')[0] || "user",
      avatar: profile?.photoURL || user?.photoURL || "",
      isVerified: user?.email === ADMIN_EMAIL || profile?.isVerified || profile?.role === 'admin',
      isPro: profile?.isPro || false,
      role: user?.email === ADMIN_EMAIL ? "admin" : (profile?.role || "user"),
      uid: user?.uid
    };

    // معالجة الصور بالضغط قبل إرسالها للـ Context لتقليل استهلاك الذاكرة
    const compressedImages = await Promise.all(localImages.map(url => compressImage(url)));

    // إرسال المهمة للـ Background Context
    startUpload({
      content,
      localImages: compressedImages,
      videoUrl: videoUrlFromParams,
      userId: user?.uid,
      authorInfo,
      privacy,
      allowComments,
      isRtl
    });

    toast({ 
      title: isRtl ? "جاري النشر في الخلفية" : "Publishing in background",
      description: isRtl ? "سنقوم بتنبيهك فور اكتمال السيادة." : "Browsing is safe now."
    });
    
    // العودة الفورية المطلقة دون انتظار أي رندرة إضافية
    router.replace("/");
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative overflow-hidden">
      <header className="p-4 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-md z-20 border-b border-zinc-900">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-zinc-900">
          <X className="h-6 w-6" />
        </Button>
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Sovereign Upload</span>
        <Button 
          onClick={handleSubmit} 
          disabled={isBanned || isProcessing || (!content.trim() && localImages.length === 0 && !videoUrlFromParams)} 
          className="rounded-full px-8 font-black bg-white text-black hover:bg-zinc-200 min-w-[80px]"
        >
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : (isRtl ? "نشر" : "Post")}
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto pb-32 p-4 custom-scrollbar">
        <div className="flex gap-4">
          <Avatar className="h-11 w-11 border border-zinc-800">
            <AvatarImage src={user?.photoURL || ""} />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <Textarea 
              placeholder={isRtl ? "شارك فكرة حرة..." : "Share a free thought..."} 
              className="bg-transparent border-none resize-none focus-visible:ring-0 p-0 text-lg font-medium min-h-[120px] mb-4" 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
            />

            {localImages.length > 0 && (
              <div className="w-full overflow-hidden mb-6">
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 snap-x">
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
                      className="h-32 w-32 shrink-0 rounded-2xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center gap-2 hover:bg-zinc-900 transition-colors"
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
              <div className="relative aspect-video rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 mb-6 shadow-2xl">
                <video src={videoUrlFromParams} className="w-full h-full object-contain" autoPlay muted loop />
              </div>
            )}

            <div className="space-y-4 pt-6 border-t border-zinc-900">
               <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-900 rounded-[2rem]">
                  <span className="text-sm font-bold">{isRtl ? "الجمهور" : "Audience"}</span>
                  <Select value={privacy} onValueChange={setPrivacy}>
                    <SelectTrigger className="w-[100px] bg-zinc-900 border-none h-8 text-xs font-bold"><SelectValue /></SelectTrigger>
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
