
"use client";

import { useState, Suspense, useEffect } from "react";
import { 
  ArrowLeft, 
  ChevronRight, 
  Tag, 
  MapPin, 
  Download, 
  EyeOff, 
  Bot, 
  ChevronDown,
  LayoutGrid
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

function CreatePostContent() {
  const { isRtl } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const db = useFirestore();
  const { user } = useUser();
  
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settings, setSettings] = useState({
    allowDownload: true,
    markSensitive: false,
    isAiGenerated: false
  });
  
  const imageUrl = searchParams.get("image");
  const videoUrl = searchParams.get("video");

  const handleSubmit = async () => {
    if (!content.trim() && !imageUrl && !videoUrl) return;

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

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative overflow-hidden">
      {/* Header */}
      <header className="p-4 flex items-center justify-between sticky top-0 bg-black z-20">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()}
          className="rounded-full hover:bg-white/10 text-white p-0 h-auto w-auto"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-bold">
          {videoUrl ? "New video post" : (imageUrl ? "New image post" : "New post")}
        </h1>
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="rounded-full px-6 font-bold bg-white text-black hover:bg-zinc-200 h-8 transition-all"
        >
          {isSubmitting ? "..." : "Post"}
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Media Preview Section */}
        <div className="flex justify-center p-4">
          <div className="relative rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900 aspect-[3/4] w-48 shadow-lg">
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
          </div>
        </div>

        {/* Caption Input */}
        <div className="px-4 py-6">
          <Textarea
            placeholder="Add a caption..."
            className="w-full bg-transparent border-none text-zinc-300 resize-none focus-visible:ring-0 p-0 placeholder:text-zinc-600 min-h-[100px]"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        {/* Settings List */}
        <div className="flex flex-col border-t border-zinc-900">
          {/* Topic */}
          <div className="flex items-center justify-between p-4 hover:bg-zinc-900/50 cursor-pointer transition-colors">
            <div className="flex items-center gap-4">
              <LayoutGrid className="h-5 w-5 text-zinc-400" />
              <span className="text-sm font-medium">Topic</span>
            </div>
            <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 font-normal hover:bg-zinc-800">Topic</Badge>
          </div>

          {/* Tag people */}
          <div className="flex items-center justify-between p-4 hover:bg-zinc-900/50 cursor-pointer transition-colors">
            <div className="flex items-center gap-4">
              <Tag className="h-5 w-5 text-zinc-400" />
              <span className="text-sm font-medium">Tag people</span>
            </div>
            <ChevronRight className="h-5 w-5 text-zinc-600" />
          </div>

          {/* Add location */}
          <div className="flex items-center justify-between p-4 hover:bg-zinc-900/50 cursor-pointer transition-colors">
            <div className="flex items-center gap-4">
              <MapPin className="h-5 w-5 text-zinc-400" />
              <span className="text-sm font-medium">Add location</span>
            </div>
            <ChevronRight className="h-5 w-5 text-zinc-600" />
          </div>

          {/* Allow download */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <Download className="h-5 w-5 text-zinc-400" />
              <span className="text-sm font-medium">Allow download</span>
            </div>
            <Switch 
              checked={settings.allowDownload} 
              onCheckedChange={(val) => setSettings(s => ({...s, allowDownload: val}))}
              className="data-[state=checked]:bg-white data-[state=unchecked]:bg-zinc-800"
            />
          </div>

          {/* Mark sensitive */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <EyeOff className="h-5 w-5 text-zinc-400" />
              <span className="text-sm font-medium">Mark sensitive</span>
            </div>
            <Switch 
              checked={settings.markSensitive} 
              onCheckedChange={(val) => setSettings(s => ({...s, markSensitive: val}))}
              className="data-[state=checked]:bg-white data-[state=unchecked]:bg-zinc-800"
            />
          </div>

          {/* Mark as AI generated */}
          <div className="flex items-center justify-between p-4 mb-20">
            <div className="flex items-center gap-4">
              <Bot className="h-5 w-5 text-zinc-400" />
              <span className="text-sm font-medium">Mark as AI generated</span>
            </div>
            <Switch 
              checked={settings.isAiGenerated} 
              onCheckedChange={(val) => setSettings(s => ({...s, isAiGenerated: val}))}
              className="data-[state=checked]:bg-white data-[state=unchecked]:bg-zinc-800"
            />
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
