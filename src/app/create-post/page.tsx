
"use client";

import { useState, Suspense } from "react";
import { 
  ArrowLeft, 
  ChevronRight, 
  Tag, 
  MapPin, 
  Download, 
  EyeOff, 
  Bot, 
  LayoutGrid,
  X,
  Plus,
  Mic
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const MAX_CHARS = 2500;

const TOPICS = ["General", "News", "Entertainment", "Sports", "Tech", "Life"];

function CreatePostContent() {
  const { isRtl } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const db = useFirestore();
  const { user } = useUser();
  
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState("General");
  const [settings, setSettings] = useState({
    allowDownload: true,
    markSensitive: false,
    isAiGenerated: false
  });
  
  const imageUrl = searchParams.get("image");
  const videoUrl = searchParams.get("video");
  const audioUrl = searchParams.get("audio");

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

      await addDoc(collection(db, "posts"), {
        content,
        mediaUrl: imageUrl || videoUrl || audioUrl || null,
        mediaType: imageUrl ? "image" : (videoUrl ? "video" : (audioUrl ? "audio" : null)),
        authorId: user?.uid || "anonymous",
        author: {
          name: user?.displayName || "User",
          handle: user?.email?.split('@')[0] || "user",
          avatar: user?.photoURL || "https://picsum.photos/seed/me/100/100"
        },
        likesCount: 0,
        likedBy: [],
        createdAt: serverTimestamp(),
        topic: selectedTopic,
        settings: settings
      });

      toast({
        title: isRtl ? "تم النشر" : "Posted",
        description: isRtl ? "تم نشر منشورك بنجاح" : "Your post has been published successfully.",
      });
      
      router.push("/");
    } catch (error) {
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

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative overflow-hidden">
      {/* Header */}
      <header className="p-4 flex items-center justify-between sticky top-0 bg-black z-20">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()}
          className="rounded-full hover:bg-white/10 text-white"
        >
          <X className="h-6 w-6" />
        </Button>
        <h1 className="text-sm font-bold opacity-70">
          {videoUrl ? "New video post" : (imageUrl ? "New image post" : (audioUrl ? "New voice post" : "New post"))}
        </h1>
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || content.length > MAX_CHARS}
          className="rounded-full px-6 font-bold bg-white text-black hover:bg-zinc-200 h-8 transition-all"
        >
          {isSubmitting ? "..." : "Post"}
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        {/* User Info and Text Area */}
        <div className="p-4 flex gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={user?.photoURL || "https://picsum.photos/seed/me/100/100"} />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder="Say something..."
              className="w-full bg-transparent border-none text-zinc-300 resize-none focus-visible:ring-0 p-0 placeholder:text-zinc-600 min-h-[120px] text-lg"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>

        {/* Media Preview Section */}
        {(imageUrl || videoUrl || audioUrl) && (
          <div className="px-4 pb-6">
            <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 aspect-[3/4] w-40 shadow-xl group">
              {imageUrl && <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />}
              {videoUrl && (
                <div className="relative w-full h-full">
                  <video src={videoUrl} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center">
                      <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1" />
                    </div>
                  </div>
                </div>
              )}
              {audioUrl && (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4 bg-zinc-900">
                  <Mic className="h-12 w-12 text-primary animate-pulse" />
                  <span className="text-xs font-bold text-zinc-500">Voice clip ready</span>
                </div>
              )}
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 rounded-full bg-black/40 h-6 w-6 text-white" onClick={() => router.back()}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Toolbar Settings */}
        <div className="flex flex-col border-t border-zinc-900 pt-2 pb-24">
          <div className="flex items-center justify-between p-4 hover:bg-zinc-900/50 cursor-pointer" onClick={() => {
            const next = TOPICS[(TOPICS.indexOf(selectedTopic) + 1) % TOPICS.length];
            setSelectedTopic(next);
          }}>
            <div className="flex items-center gap-4">
              <LayoutGrid className="h-5 w-5 text-zinc-400" />
              <span className="text-sm font-medium">Topic</span>
            </div>
            <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 font-normal hover:bg-zinc-800 uppercase tracking-tighter">
              {selectedTopic}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-4 hover:bg-zinc-900/50 cursor-pointer">
            <div className="flex items-center gap-4">
              <MapPin className="h-5 w-5 text-zinc-400" />
              <span className="text-sm font-medium">Add location</span>
            </div>
            <ChevronRight className="h-5 w-5 text-zinc-600" />
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <Download className="h-5 w-5 text-zinc-400" />
              <span className="text-sm font-medium">Allow download</span>
            </div>
            <Switch 
              checked={settings.allowDownload} 
              onCheckedChange={(val) => setSettings(s => ({...s, allowDownload: val}))}
            />
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <Bot className="h-5 w-5 text-zinc-400" />
              <span className="text-sm font-medium">Mark as AI generated</span>
            </div>
            <Switch 
              checked={settings.isAiGenerated} 
              onCheckedChange={(val) => setSettings(s => ({...s, isAiGenerated: val}))}
            />
          </div>
        </div>
      </main>

      {/* Bottom Sticky Counter and Tools */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-black border-t border-zinc-900 flex items-center justify-between">
        <div className="flex gap-4">
          <Plus className="h-6 w-6 text-primary cursor-pointer" />
          <LayoutGrid className="h-6 w-6 text-zinc-500 cursor-pointer" />
        </div>
        
        <div className="relative flex items-center">
          <svg className="h-10 w-10 transform -rotate-90">
            <circle
              cx="20"
              cy="20"
              r="16"
              stroke="currentColor"
              strokeWidth="2"
              fill="transparent"
              className="text-zinc-800"
            />
            <circle
              cx="20"
              cy="20"
              r="16"
              stroke="currentColor"
              strokeWidth="2"
              fill="transparent"
              strokeDasharray={100}
              strokeDashoffset={100 - progress}
              className={cn(
                "transition-all duration-300",
                content.length > MAX_CHARS ? "text-red-500" : "text-primary"
              )}
            />
          </svg>
          <span className={cn(
            "absolute text-[10px] w-full text-center font-bold",
            content.length > MAX_CHARS ? "text-red-500" : "text-zinc-500"
          )}>
            {content.length > 0 && MAX_CHARS - content.length}
          </span>
        </div>
      </div>
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
