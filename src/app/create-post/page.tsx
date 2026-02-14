
"use client";

import { useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { moderateContent } from "@/ai/flows/content-moderation-assistant";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const MAX_CHARS = 2500;

export default function CreatePostPage() {
  const { isRtl, t } = useLanguage();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || content.length > MAX_CHARS) return;

    setIsSubmitting(true);
    try {
      const result = await moderateContent({ text: content });
      
      if (!result.isAppropriate) {
        toast({
          title: isRtl ? "محتوى غير لائق" : "Inappropriate Content",
          description: isRtl 
            ? "تم اكتشاف محتوى قد ينتهك سياساتنا: " + result.moderationFlags.join(", ")
            : "Content detected that might violate our policies: " + result.moderationFlags.join(", "),
          variant: "destructive",
        });
      } else {
        toast({
          title: isRtl ? "تم النشر" : "Posted",
          description: isRtl ? "تم نشر منشورك بنجاح" : "Your post has been published successfully.",
        });
        router.push("/");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto border-x border-zinc-800">
      <header className="p-4 flex items-center justify-between border-b border-zinc-900 sticky top-0 bg-black/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
            className="rounded-full hover:bg-white/10"
          >
            <ArrowLeft className={isRtl ? "rotate-180" : ""} />
          </Button>
          <h1 className="font-bold text-lg">{isRtl ? "منشور جديد" : "New Post"}</h1>
        </div>
        <Button 
          onClick={handleSubmit} 
          disabled={!content.trim() || content.length > MAX_CHARS || isSubmitting}
          className="rounded-full px-6 font-bold"
        >
          {isSubmitting ? "..." : (isRtl ? "نشر" : "Post")}
        </Button>
      </header>

      <main className="flex-1 p-4 flex flex-col gap-4">
        <Textarea
          placeholder={isRtl ? "ماذا يدور في ذهنك؟ (2500 حرف)" : "What's on your mind? (2500 chars)"}
          className="flex-1 bg-transparent border-none text-xl resize-none focus-visible:ring-0 p-0 placeholder:text-zinc-600"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={MAX_CHARS}
        />
        
        <div className="flex items-center justify-between py-4 border-t border-zinc-900">
          <div className={cn(
            "text-xs font-medium",
            content.length > MAX_CHARS * 0.9 ? "text-orange-500" : "text-zinc-500"
          )}>
            {content.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
          </div>
          <div className="flex gap-2">
            <div className="h-1 w-24 bg-zinc-800 rounded-full overflow-hidden">
               <div 
                className="h-full bg-primary transition-all duration-300" 
                style={{ width: `${(content.length / MAX_CHARS) * 100}%` }}
               />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
