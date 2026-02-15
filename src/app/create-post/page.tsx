
"use client";

import { useState, Suspense, useRef, useEffect } from "react";
import { X, Plus, ImageIcon, Loader2, Sparkles } from "lucide-react";
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

  const handleSubmit = () => {
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

    // البدء الفوري والمغادرة السيادية
    startUpload({
      content,
      localImages,
      videoUrl: videoUrlFromParams,
      userId: user?.uid,
      authorInfo,
      privacy,
      allowComments,
      isRtl
    });

    toast({ 
      title: isRtl ? "جاري الرفع في الخلفية" : "Uploading in background",
      description: isRtl ? "يمكنك إكمال التصفح بحرية الآن." : "Continue browsing freely.",
    });
    
    // انتقال مطلق وبدون عودة (Replace) لضمان الخفة
    router.replace("/");
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative overflow-hidden">
      <header className="p-4 flex items-center justify-between sticky top-0 bg-black/90 backdrop-blur-xl z-20 border-b border-zinc-900">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-zinc-900">
          <X className="h-6 w-6" />
        </Button>
        <div className="flex flex-col items-center">
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Unbound OS</span>
           <div className="flex items-center gap-1">
              <Sparkles className="h-2 w-2 text-primary fill-primary" />
              <span className="text-[8px] font-black text-primary uppercase">Sovereign Upload</span>
           </div>
        </div>
        <Button 
          onClick={handleSubmit} 
          disabled={isBanned || isProcessing || (!content.trim() && localImages.length === 0 && !videoUrlFromParams)} 
          className="rounded-full px-8 font-black bg-white text-black hover:bg-zinc-200 min-w-[80px] shadow-xl"
        >
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : (isRtl ? "نشر" : "Post")}
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto pb-32 p-4 custom-scrollbar">
        <div className="flex gap-4">
          <Avatar className="h-11 w-11 border border-zinc-800 shadow-sm">
            <AvatarImage src={user?.photoURL || ""} />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <Textarea 
              placeholder={isRtl ? "شارك فكرة حرة..." : "Share a free thought..."} 
              className="bg-transparent border-none resize-none focus-visible:ring-0 p-0 text-lg font-medium min-h-[120px] mb-4 placeholder:text-zinc-700" 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
            />

            {localImages.length > 0 && (
              <div className="w-full overflow-hidden mb-6">
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 snap-x">
                  {localImages.map((img, i) => (
                    <div key={i} className="relative h-40 w-40 shrink-0 rounded-2xl overflow-hidden border border-zinc-800 group snap-center shadow-2xl">
                      <img src={img} alt="preview" className="w-full h-full object-cover" />
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 hover:bg-red-600 border-none shadow-xl"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {localImages.length < 4 && (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="h-40 w-40 shrink-0 rounded-2xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center gap-2 hover:bg-zinc-950 transition-all group"
                    >
                      <Plus className="h-6 w-6 text-zinc-600 group-hover:text-primary" />
                      <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest group-hover:text-primary">Add More</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {!videoUrlFromParams && localImages.length === 0 && (
              <div className="flex gap-4 py-4 border-t border-zinc-900/50">
                 <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-all group">
                    <div className="h-10 w-10 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800 group-hover:border-primary/30 group-hover:bg-primary/5">
                       <ImageIcon className="h-5 w-5 group-hover:text-primary" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isRtl ? "إضافة وسائط" : "Add Media"}</span>
                 </button>
              </div>
            )}

            <input type="file" accept="image/*" multiple className="hidden" ref={fileInputRef} onChange={handleAddImage} />

            {videoUrlFromParams && (
              <div className="relative aspect-video rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-950 mb-6 shadow-2xl">
                <video src={videoUrlFromParams} className="w-full h-full object-contain" autoPlay muted loop />
              </div>
            )}

            <div className="space-y-4 pt-6 border-t border-zinc-900/50">
               <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-900 rounded-3xl shadow-sm">
                  <div className="flex flex-col">
                     <span className="text-xs font-black uppercase tracking-widest">{isRtl ? "الجمهور" : "Audience"}</span>
                     <span className="text-[9px] text-zinc-600 font-bold uppercase">{isRtl ? "من يرى منشورك" : "Who sees this"}</span>
                  </div>
                  <Select value={privacy} onValueChange={setPrivacy}>
                    <SelectTrigger className="w-[110px] bg-zinc-900 border-none h-9 text-[10px] font-black uppercase tracking-widest rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-white rounded-2xl">
                      <SelectItem value="public">{isRtl ? "عام" : "Public"}</SelectItem>
                      <SelectItem value="followers">{isRtl ? "متابعون" : "Followers"}</SelectItem>
                    </SelectContent>
                  </Select>
               </div>
               <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-900 rounded-3xl shadow-sm">
                  <div className="flex flex-col">
                     <span className="text-xs font-black uppercase tracking-widest">{isRtl ? "التعليقات" : "Comments"}</span>
                     <span className="text-[9px] text-zinc-600 font-bold uppercase">{isRtl ? "فتح النقاش" : "Open discussion"}</span>
                  </div>
                  <Switch checked={allowComments} onCheckedChange={setAllowComments} className="data-[state=checked]:bg-primary" />
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
    <Suspense fallback={<div className="h-screen bg-black flex items-center justify-center text-white"><Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" /></div>}>
      <CreatePostContent />
    </Suspense>
  );
}
