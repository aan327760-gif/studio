
"use client";

import { useState } from "react";
import { Image, Video, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase";

/**
 * مكون إنشاء المنشور - تم نزع الذكاء الاصطناعي منه ليعتمد على التعبير البشري الصرف.
 */
export function CreatePost() {
  const { isRtl } = useLanguage();
  const { toast } = useToast();
  const { user } = useUser();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      // هنا يتم النشر مباشرة دون رقابة آلية، الاعتماد الآن على المشرفين
      toast({
        title: isRtl ? "تم النشر" : "Posted",
        description: isRtl ? "تم نشر فكرتك بنجاح في مجتمع بلا قيود" : "Your thought has been shared with the community.",
      });
      setContent("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-zinc-950 border-b border-zinc-900 p-6 md:rounded-[2rem] md:border md:mb-6 shadow-xl relative overflow-hidden group">
      <div className="flex gap-4 relative z-10">
        <Avatar className="h-12 w-12 border border-zinc-800">
          <AvatarImage src={user?.photoURL || "https://picsum.photos/seed/me/100/100"} />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-4">
          <Textarea
            placeholder={isRtl ? "شارك فكرة حرة..." : "Share a free thought..."}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] resize-none border-none focus-visible:ring-0 p-0 text-lg bg-transparent placeholder:text-zinc-700 font-medium"
          />
          <div className="flex items-center justify-between pt-4 border-t border-zinc-900/50">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-white rounded-xl hover:bg-white/5 h-10 px-4">
                <Image className="h-5 w-5 mr-2" />
                <span className="text-xs font-black uppercase tracking-widest">{isRtl ? "صورة" : "Image"}</span>
              </Button>
            </div>
            <Button 
              onClick={handleSubmit} 
              disabled={!content.trim() || isSubmitting}
              className="rounded-full px-10 h-12 bg-white text-black hover:bg-zinc-200 font-black shadow-xl active:scale-95 transition-all"
            >
              {isSubmitting ? "..." : (isRtl ? "نشر" : "Post")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
