
"use client";

import { 
  MessageCircle, 
  ThumbsUp, 
  Share2, 
  Globe, 
  Hash
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFirestore, useUser } from "@/firebase";
import { doc, updateDoc, increment, arrayUnion, arrayRemove } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ArticleCardProps {
  id: string;
  author: any;
  title: string;
  content: string;
  section: string;
  tags?: string[];
  image?: string;
  likes?: number;
  comments?: number;
  likedBy?: string[];
  time: string;
}

export function ArticleCard({ id, author, title, content, section, tags = [], image, likes = 0, comments = 0, likedBy = [], time }: ArticleCardProps) {
  const { isRtl } = useLanguage();
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();

  const isLiked = user ? (likedBy || []).includes(user.uid) : false;

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({ title: isRtl ? "يجب تسجيل الدخول للتفاعل" : "Sign in to interact" });
      return;
    }
    
    try {
      const articleRef = doc(db, "articles", id);
      const authorRef = doc(db, "users", author.uid);

      if (isLiked) {
        await updateDoc(articleRef, { likesCount: increment(-1), likedBy: arrayRemove(user.uid) });
        await updateDoc(authorRef, { points: increment(-2) });
      } else {
        await updateDoc(articleRef, { likesCount: increment(1), likedBy: arrayUnion(user.uid) });
        await updateDoc(authorRef, { points: increment(2) });
        toast({ title: isRtl ? "أعجبك المقال" : "Article Liked", description: isRtl ? "+2 نقطة للكاتب" : "+2 points for author" });
      }
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
      <p className="text-sm text-zinc-400 line-clamp-3 mb-3 font-medium leading-relaxed">{content}</p>

      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag, idx) => (
            <button 
              key={idx} 
              className="text-[10px] font-black text-primary bg-primary/5 px-2 py-1 rounded-lg border border-primary/10 hover:bg-primary/10 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/explore?q=${tag}`);
              }}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

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
          <button className={cn("flex items-center gap-1.5 transition-colors", isLiked ? "text-primary" : "text-zinc-600 hover:text-white")} onClick={handleLike}>
            <ThumbsUp className={cn("h-4 w-4", isLiked && "fill-primary")} />
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
