
"use client";

import { useState, Suspense, useEffect } from "react";
import { X, Image as ImageIcon, Video, Bot, MapPin, Hash, Globe, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { moderateContent } from "@/ai/flows/content-moderation-assistant";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFirestore, useAuth, useUser } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const MAX_CHARS = 2500;

function CreatePostContent() {
  const { isRtl, t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const db = useFirestore();
  const { user } = useUser();
  
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const imageUrl = searchParams.get("image");
  const videoUrl = searchParams.get("video");

  const handleSubmit = async () => {
    if (!content.trim() && !imageUrl && !videoUrl) return;
    if (content.length > MAX_CHARS) return;

    setIsSubmitting(true);
    try {
      // 1. AI Moderation
      const moderationResult = await moderateContent({ text: content || "Media Post" });
      
      if (!moderationResult.isAppropriate) {
        toast({
          title: isRtl ? "محتوى غير لائق" : "Inappropriate Content",
          description: isRtl 
            ? "تم اكتشاف محتوى قد ينتهك سياساتنا: " + moderationResult.moderationFlags.join(", ")
            : "Content detected that might violate our policies: " + moderationResult.moderationFlags.join(", "),
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // 2. Firestore Upload
      await addDoc(collection(db, "posts"), {
        content,
        mediaUrl: imageUrl || videoUrl || null,
        mediaType: imageUrl ? "image" : (videoUrl ? "video" : null),
        authorId: user?.uid || "anonymous",
        author: {
          name: user?.displayName || "User",
          handle: user?.email?.split('@')[0] || "user",
          avatar: user?.photoURL || "https://picsum.photos/seed/me/100/100"
        },
        likesCount: 0,
        createdAt: serverTimestamp(),
      });

      toast({
        title: isRtl ? "تم النشر" : "Posted",
        description: isRtl ? "تم نشر منشورك بنجاح" : "Your post has been published successfully.",
      });
      
      router.push("/");
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong during upload.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (content.length / MAX_CHARS) * 100;
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative overflow-hidden">
      {/* Header */}
      <header className="p-4 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-md z-20">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()}
          className="rounded-full hover:bg-white/10 text-white"
        >
          <X className="h-6 w-6" />
        </Button>
        <div className="flex items-center gap-2">
           <Button variant="ghost" className="text-primary text-sm font-bold">Drafts</Button>
           <Button 
            onClick={handleSubmit} 
            disabled={(!content.trim() && !imageUrl && !videoUrl) || content.length > MAX_CHARS || isSubmitting}
            className="rounded-full px-6 font-bold bg-white text-black hover:bg-zinc-200 h-9 transition-all active:scale-95"
          >
            {isSubmitting ? "..." : (isRtl ? "نشر" : "Post")}
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 overflow-y-auto custom-scrollbar pb-32">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 shrink-0 border border-zinc-800">
            <AvatarImage src={user?.photoURL || "https://picsum.photos/seed/me/100/100"} />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 flex flex-col gap-4">
            {/* Visibility Selector */}
            <div className="flex items-center gap-1 text-[10px] font-bold text-primary border border-primary/30 w-fit px-2 py-0.5 rounded-full bg-primary/5">
              <Globe className="h-3 w-3" />
              <span>Everyone can reply</span>
            </div>

            <Textarea
              placeholder={isRtl ? "قل شيئاً..." : "What's happening?"}
              className="w-full bg-transparent border-none text-lg resize-none focus-visible:ring-0 p-0 placeholder:text-zinc-600 min-h-[120px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={MAX_CHARS}
              autoFocus
            />

            {/* Media Preview */}
            {(imageUrl || videoUrl) && (
              <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 aspect-video group">
                {imageUrl && <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />}
                {videoUrl && <video src={videoUrl} className="w-full h-full object-cover" controls />}
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => router.push('/create-post')}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Sticky Bottom Actions */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-black border-t border-zinc-900 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10 p-0 h-auto w-auto">
              <ImageIcon className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10 p-0 h-auto w-auto">
              <Video className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10 p-0 h-auto w-auto">
              <MapPin className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10 p-0 h-auto w-auto">
              <Hash className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10 p-0 h-auto w-auto">
              <Bot className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            {/* Circular Progress */}
            <div className="relative h-6 w-6 flex items-center justify-center">
              <svg className="h-6 w-6 -rotate-90">
                <circle
                  cx="12"
                  cy="12"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="transparent"
                  className="text-zinc-800"
                />
                <circle
                  cx="12"
                  cy="12"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  className={cn(
                    "transition-all duration-300",
                    content.length > MAX_CHARS * 0.9 ? "text-orange-500" : "text-primary"
                  )}
                />
              </svg>
              {content.length > MAX_CHARS * 0.9 && (
                <span className="absolute text-[8px] font-bold">
                  {MAX_CHARS - content.length}
                </span>
              )}
            </div>
            <div className="w-[1px] h-6 bg-zinc-800" />
            <Button variant="ghost" size="icon" className="text-primary rounded-full border border-zinc-800 h-7 w-7">
               <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}

const Plus = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export default function CreatePostPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-black flex items-center justify-center text-white">Loading...</div>}>
      <CreatePostContent />
    </Suspense>
  );
}
