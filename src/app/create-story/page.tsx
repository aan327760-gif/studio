
"use client";

import { useState, useRef } from "react";
import { X, Camera, Video, Loader2, AlertTriangle, CheckCircle2, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, doc, Timestamp, increment, updateDoc } from "firebase/firestore";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function CreateStoryPage() {
  const { isRtl } = useLanguage();
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();

  const userProfileRef = useMemoFirebase(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<any>(userProfileRef);

  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [isUploading, setIsUploading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // بروتوكول الـ 30 ثانية للفيديو
    if (file.type.startsWith("video/")) {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > 30.9) { 
          toast({
            variant: "destructive",
            title: isRtl ? "فيديو طويل جداً" : "Video too long",
            description: isRtl ? "الحد الأقصى هو 30 ثانية للستوري السيادي." : "Max duration is 30 seconds."
          });
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }
        upload(file, "video");
      };
      video.src = URL.createObjectURL(file);
    } else {
      upload(file, "image");
    }
  };

  const upload = async (file: File, type: "image" | "video") => {
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target?.result as string;
        const uploadedUrl = await uploadToCloudinary(base64Data, type);
        setMediaUrl(uploadedUrl);
        setMediaType(type);
        setIsUploading(false);
        toast({ title: isRtl ? "تمت المعالجة بنجاح" : "Media authenticated" });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({ variant: "destructive", title: "Sovereign Upload Failed" });
      setIsUploading(false);
    }
  };

  const handlePublish = async () => {
    if (!user || !mediaUrl || !profile) return;
    
    if (profile.points < 50) {
      toast({ variant: "destructive", title: isRtl ? "نقاط غير كافية" : "Insufficient Points", description: isRtl ? "تحتاج 50 نقطة لنشر ستوري." : "You need 50 points." });
      return;
    }

    setIsPublishing(true);
    try {
      // الستوري تنتهي تلقائياً بعد 24 ساعة
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await addDoc(collection(db, "stories"), {
        authorId: user.uid,
        authorName: profile.displayName,
        authorAvatar: profile.photoURL,
        mediaUrl,
        mediaType,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
        priorityScore: profile.isVerified ? 500 : 0
      });

      // خصم نقاط نشر الستوري
      await updateDoc(userProfileRef!, { points: increment(-50) });

      toast({ 
        title: isRtl ? "تم نشر الستوري السيادية" : "Story Published",
        description: isRtl ? "ستختفي قصتك بعد 24 ساعة." : "Vanish in 24h."
      });
      router.push("/");
    } catch (e) {
      toast({ variant: "destructive", title: "Publish Protocol Failure" });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white max-w-md mx-auto relative flex flex-col pb-10">
      <header className="p-6 flex items-center justify-between border-b border-zinc-900 bg-black/80 backdrop-blur-xl sticky top-0 z-20">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-zinc-900 hover:bg-zinc-800">
          <X className="h-5 w-5" />
        </Button>
        <div className="flex flex-col items-center">
           <h1 className="font-black uppercase tracking-[0.3em] text-[10px] text-primary">Sovereign Pulse</h1>
           <div className="flex items-center gap-1">
              <Award className="h-2 w-2 text-zinc-600" />
              <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">{profile?.points || 0} Points</span>
           </div>
        </div>
        <Button 
          onClick={handlePublish} 
          disabled={!mediaUrl || isPublishing || (profile?.points < 50)} 
          className="rounded-full px-8 bg-white text-black hover:bg-zinc-200 font-black h-10 shadow-xl active:scale-95 transition-all"
        >
          {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : (isRtl ? "نشر" : "Share")}
        </Button>
      </header>

      <main className="flex-1 flex flex-col p-6 gap-8 mt-4">
        <div 
          className="flex-1 min-h-[450px] rounded-[3.5rem] border-2 border-dashed border-zinc-800 bg-zinc-950 flex flex-col items-center justify-center gap-6 cursor-pointer hover:border-primary/50 transition-all overflow-hidden relative shadow-[0_0_50px_-12px_rgba(30,111,201,0.1)] group"
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                 <Loader2 className="h-16 w-16 animate-spin text-primary opacity-40" />
                 <Sparkles className="h-6 w-6 text-primary absolute inset-0 m-auto animate-pulse" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 animate-pulse">Authenticating Media</p>
            </div>
          ) : mediaUrl ? (
            <div className="w-full h-full relative">
              {mediaType === "image" ? (
                <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <video src={mediaUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
              )}
              <div className="absolute top-6 right-6 bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-2xl">
                 <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <Camera className="h-12 w-12 text-white/50" />
              </div>
            </div>
          ) : (
            <>
              <div className="h-28 w-28 rounded-[3rem] bg-zinc-900 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                <Camera className="h-12 w-12 text-zinc-700" />
              </div>
              <div className="text-center space-y-4">
                <p className="font-black text-2xl tracking-tighter uppercase">{isRtl ? "التقط النبض" : "Capture Pulse"}</p>
                <div className="flex items-center gap-3 justify-center">
                   <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase px-3 py-1 tracking-widest">30s Video</Badge>
                   <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase px-3 py-1 tracking-widest">High Res</Badge>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="bg-zinc-950 p-7 rounded-[3rem] border border-zinc-900 space-y-5 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5"><AlertTriangle className="h-12 w-12 text-primary" /></div>
           <div className="flex items-center gap-5 relative z-10">
              <div className="h-14 w-14 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-lg">
                 <AlertTriangle className="h-7 w-7 text-orange-500" />
              </div>
              <div className="flex-1">
                 <p className="text-sm font-black uppercase tracking-widest mb-1">{isRtl ? "ميثاق الـ 30 ثانية" : "30s Protocol"}</p>
                 <p className="text-[11px] text-zinc-500 font-bold leading-relaxed">{isRtl ? "لضمان سرعة نقل الخبر، لا نقبل فيديوهات تتجاوز 30 ثانية. القوة في الإيجاز والسيادة." : "To ensure speed, we enforce a strict 30s limit for all sovereign stories."}</p>
              </div>
           </div>
           <div className="pt-4 border-t border-zinc-900/50 flex justify-between items-center">
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{isRtl ? "تكلفة النشر" : "Publishing Cost"}</span>
              <span className="text-xs font-black text-red-500">-50 Points</span>
           </div>
        </div>

        <input 
          type="file" 
          accept="image/*,video/*" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleMediaSelect} 
        />
      </main>
    </div>
  );
}
