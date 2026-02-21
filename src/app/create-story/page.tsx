
"use client";

import { useState, useRef } from "react";
import { X, Camera, Loader2, CheckCircle2, Award, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, doc, Timestamp, increment, updateDoc } from "firebase/firestore";
import { uploadToCloudinary } from "@/lib/cloudinary";

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
    const type = file.type.startsWith("video/") ? "video" : "image";
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
    if (!user || !mediaUrl || !profile) return;
    if (profile.points < 50) {
      toast({ variant: "destructive", title: isRtl ? "نقاط غير كافية" : "Insufficient Points" });
      return;
    }
    setIsPublishing(true);
    try {
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
      await updateDoc(userProfileRef!, { points: increment(-50) });
      router.push("/");
    } catch (e) {
      toast({ variant: "destructive", title: "Publish error" });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white max-w-md mx-auto relative flex flex-col pb-10">
      <header className="p-6 flex items-center justify-between border-b border-zinc-900 bg-black/80 backdrop-blur-xl sticky top-0 z-20">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-zinc-900"><X className="h-5 w-5" /></Button>
        <div className="flex flex-col items-center">
           <h1 className="font-black uppercase tracking-[0.2em] text-[10px] text-primary">Pulse</h1>
           <div className="flex items-center gap-1">
              <Award className="h-2 w-2 text-zinc-600" />
              <span className="text-[7px] font-black text-zinc-600">{profile?.points || 0} Points</span>
           </div>
        </div>
        <Button onClick={handlePublish} disabled={!mediaUrl || isPublishing || (profile?.points < 50)} className="rounded-full px-8 bg-white text-black font-black">
          {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : (isRtl ? "نشر" : "Share")}
        </Button>
      </header>
      <main className="flex-1 flex flex-col p-6 gap-8">
        <div className="flex-1 min-h-[400px] rounded-[3rem] border-2 border-dashed border-zinc-800 bg-zinc-950 flex flex-col items-center justify-center gap-6 cursor-pointer overflow-hidden relative" onClick={() => fileInputRef.current?.click()}>
          {isUploading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            </div>
          ) : mediaUrl ? (
            <div className="w-full h-full">
              {mediaType === "image" ? <img src={mediaUrl} className="w-full h-full object-cover" /> : <video src={mediaUrl} className="w-full h-full object-cover" autoPlay muted loop />}
            </div>
          ) : (
            <Camera className="h-12 w-12 text-zinc-700" />
          )}
        </div>
        <input type="file" accept="image/*,video/*" className="hidden" ref={fileInputRef} onChange={handleMediaSelect} />
      </main>
    </div>
  );
}
