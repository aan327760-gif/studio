
"use client";

import { 
  MessageCircle, 
  ThumbsUp, 
  Share2, 
  Globe, 
  Award
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFirestore, useUser } from "@/firebase";
import { doc, updateDoc, increment } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";

interface ArticleCardProps {
  id: string;
  author: any;
  title: string;
  content: string;
  section: string;
  image?: string;
  likes?: number;
  comments?: number;
  time: string;
}

export function ArticleCard({ id, author, title, content, section, image, likes = 0, comments = 0, time }: ArticleCardProps) {
  const { isRtl } = useLanguage();
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({ title: isRtl ? "يجب تسجيل الدخول للتفاعل" : "Sign in to interact" });
      return;
    }
    
    try {
      const articleRef = doc(db, "articles", id);
      const authorRef = doc(db, "users", author.uid);

      // Points logic: +2 for author on like
      await updateDoc(articleRef, { likesCount: increment(1) });
      await updateDoc(authorRef, { points: increment(2) });
      
      toast({ title: isRtl ? "أعجبك المقال" : "Article Liked", description: isRtl ? "+2 نقطة للكاتب" : "+2 points for author" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error" });
    }
  };

  return (
    <div 
      className="p-5 border-b border-zinc-900 hover:bg-zinc-950 transition-all cursor-pointer group"
      onClick={() => router.push(`/post/${id}`)}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase px-2 h-5">
            {section}
          </Badge>
          <span className="text-[10px] text-zinc-600 font-bold">• {time}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-zinc-900 px-2 py-0.5 rounded-full">
          <Globe className="h-3 w-3 text-zinc-500" />
          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">{author.nationality}</span>
        </div>
      </div>

      <h2 className="text-lg font-black leading-tight mb-2 group-hover:text-primary transition-colors">{title}</h2>
      <p className="text-sm text-zinc-400 line-clamp-3 mb-4 font-medium leading-relaxed">{content}</p>

      {image && (
        <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-zinc-900 mb-4 bg-zinc-900">
          <img src={image} alt="Article" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/profile/${author.uid}`} className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Avatar className="h-6 w-6 border border-zinc-800">
              <AvatarFallback className="text-[8px]">{author.name?.[0]}</AvatarFallback>
            </Avatar>
            <span className="text-[11px] font-bold text-zinc-300">@{author.name}</span>
          </Link>
        </div>

        <div className="flex items-center gap-6" onClick={(e) => e.stopPropagation()}>
          <button className="flex items-center gap-1.5 text-zinc-600 hover:text-white transition-colors" onClick={handleLike}>
            <ThumbsUp className="h-4 w-4" />
            <span className="text-xs font-black">{likes}</span>
          </button>
          <button className="flex items-center gap-1.5 text-zinc-600 hover:text-white transition-colors">
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs font-black">{comments}</span>
          </button>
          <button className="text-zinc-600 hover:text-primary transition-colors" onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(`${window.location.origin}/post/${id}`);
            toast({ title: isRtl ? "تم نسخ الرابط" : "Link Copied" });
          }}>
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
