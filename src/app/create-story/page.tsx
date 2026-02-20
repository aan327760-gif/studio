
"use client";

import { useState, useRef } from "react";
import { X, Camera, Video, Loader2, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, doc, Timestamp } from "firebase/firestore";
import { uploadToCloudinary } from "@/lib/cloudinary";
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

    // فحص مدة الفيديو قبل الرفع
    if (file.type.startsWith("video/")) {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > 30.5) { // هامش بسيط لـ 30 ثانية
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
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({ variant: "destructive", title: "Upload Failed" });
      setIsUploading(false);
    }
  };

  const handlePublish = async () => {
    if (!user || !mediaUrl) return;
    setIsPublishing(true);
    try {
      // الستوري تنتهي بعد 24 ساعة
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await addDoc(collection(db, "stories"), {
        authorId: user.uid,
        authorName: profile?.displayName || user.displayName,
        authorAvatar: profile?.photoURL || user.photoURL,
        mediaUrl,
        mediaType,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt)
      });

      toast({ title: isRtl ? "تم نشر قصتك السيادية" : "Story Published" });
      router.push("/");
    } catch (e) {
      toast({ variant: "destructive", title: "Publish Error" });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white max-w-md mx-auto relative flex flex-col">
      <header className="p-4 flex items-center justify-between border-b border-zinc-900 bg-black/80 backdrop-blur-xl sticky top-0 z-20">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <X className="h-6 w-6" />
        </Button>
        <h1 className="font-black uppercase tracking-tighter text-sm">{isRtl ? "قصة جديدة" : "New Story"}</h1>
        <Button 
          onClick={handlePublish} 
          disabled={!mediaUrl || isPublishing} 
          className="rounded-full px-6 bg-primary text-white font-black h-9"
        >
          {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : (isRtl ? "نشر" : "Share")}
        </Button>
      </header>

      <main className="flex-1 flex flex-col p-6 gap-8">
        <div 
          className="flex-1 rounded-[3rem] border-2 border-dashed border-zinc-800 bg-zinc-950 flex flex-col items-center justify-center gap-6 cursor-pointer hover:border-primary/50 transition-all overflow-hidden relative"
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Processing Media</p>
            </div>
          ) : mediaUrl ? (
            mediaType === "image" ? (
              <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <video src={mediaUrl} className="w-full h-full object-cover" autoPlay muted loop />
            )
          ) : (
            <>
              <div className="h-20 w-20 rounded-[2rem] bg-zinc-900 flex items-center justify-center">
                <Camera className="h-10 w-10 text-zinc-500" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-black text-lg">{isRtl ? "التقط اللحظة" : "Capture the Moment"}</p>
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{isRtl ? "فيديو 30 ثانية أو صورة" : "30s Video or Photo"}</p>
              </div>
            </>
          )}
        </div>

        <div className="bg-zinc-950 p-6 rounded-[2rem] border border-zinc-900 space-y-4">
           <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                 <AlertTriangle className="h-5 w-5 text-orange-500" />
              </div>
              <div className="flex-1">
                 <p className="text-xs font-black uppercase">{isRtl ? "بروتوكول الـ 30 ثانية" : "30s Protocol"}</p>
                 <p className="text-[9px] text-zinc-500 font-bold leading-relaxed">{isRtl ? "لضمان سرعة نقل النبض القومي، لا نقبل فيديوهات تتجاوز 30 ثانية في الستوري." : "To ensure speed, we don't accept stories over 30s."}</p>
              </div>
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
