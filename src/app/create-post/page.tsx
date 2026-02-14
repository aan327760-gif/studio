
"use client";

import { useState } from "react";
import { X, Image as ImageIcon, Video, MapPin, Bot, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { moderateContent } from "@/ai/flows/content-moderation-assistant";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

  const progress = (content.length / MAX_CHARS) * 100;
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative">
      {/* Header */}
      <header className="p-4 flex items-center justify-between sticky top-0 bg-black z-10">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()}
          className="rounded-full hover:bg-white/10 text-white"
        >
          <X className="h-6 w-6" />
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={!content.trim() || content.length > MAX_CHARS || isSubmitting}
          className="rounded-full px-6 font-bold bg-[#D1D5DB] text-black hover:bg-zinc-300 h-9"
        >
          {isSubmitting ? "..." : (isRtl ? "نشر" : "Post")}
        </Button>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 flex gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src="https://picsum.photos/seed/me/100/100" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        <Textarea
          placeholder={isRtl ? "قل شيئاً..." : "Say something..."}
          className="flex-1 bg-transparent border-none text-lg resize-none focus-visible:ring-0 p-0 pt-2 placeholder:text-zinc-600 min-h-[300px]"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={MAX_CHARS}
          autoFocus
        />
      </main>

      {/* Footer / Toolbar */}
      <footer className="p-4 border-t border-zinc-900 bg-black sticky bottom-0 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white p-0 h-auto w-auto">
            <ImageIcon className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white p-0 h-auto w-auto">
            <Video className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-1 px-3 py-1 bg-zinc-900 rounded-full text-xs font-medium text-zinc-400">
             <span className="opacity-60">{isRtl ? "موضوع" : "Topic"}</span>
          </div>
          <Button variant="ghost" className="text-primary text-xs font-semibold p-0 h-auto hover:bg-transparent">
             {isRtl ? "أضف موقعاً" : "Add location"}
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white p-0 h-auto w-auto">
            <Bot className="h-6 w-6" />
          </Button>
          
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
        </div>
      </footer>
    </div>
  );
}
