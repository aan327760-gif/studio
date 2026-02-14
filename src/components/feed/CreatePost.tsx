"use client";

import { useState } from "react";
import { Image, Video, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLanguage } from "@/context/LanguageContext";
import { moderateContent } from "@/ai/flows/content-moderation-assistant";
import { useToast } from "@/hooks/use-toast";

export function CreatePost() {
  const { t, isRtl } = useLanguage();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;

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
        // Success logic here
        toast({
          title: isRtl ? "تم النشر" : "Posted",
          description: isRtl ? "تم نشر منشورك بنجاح" : "Your post has been published successfully.",
        });
        setContent("");
      }
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
    <div className="bg-white border-b p-4 md:rounded-2xl md:border md:mb-6 shadow-sm">
      <div className="flex gap-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src="https://picsum.photos/seed/me/100/100" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-3">
          <Textarea
            placeholder={t("createPost")}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[80px] resize-none border-none focus-visible:ring-0 p-0 text-base"
          />
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary rounded-full">
                <Image className="h-5 w-5 mr-1.5" />
                <span className="text-xs font-medium">{isRtl ? "صورة" : "Image"}</span>
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary rounded-full">
                <Video className="h-5 w-5 mr-1.5" />
                <span className="text-xs font-medium">{isRtl ? "فيديو" : "Video"}</span>
              </Button>
            </div>
            <Button 
              onClick={handleSubmit} 
              disabled={!content.trim() || isSubmitting}
              className="rounded-full px-6 bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? "..." : t("post")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
