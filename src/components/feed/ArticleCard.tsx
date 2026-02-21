
"use client";

import { useState } from "react";
import { 
  MessageCircle, 
  ThumbsUp, 
  Bookmark, 
  Globe, 
  ChevronLeft,
  ChevronRight,
  Share2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, increment, arrayUnion, arrayRemove, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { VerificationBadge } from "@/components/ui/verification-badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface ArticleCardProps {
  id: string;
  author: any;
  title: string;
  content: string;
  section: string;
  tags?: string[];
  image?: string;
  mediaUrls?: string[];
  likes?: number;
  comments?: number;
  likedBy?: string[];
  savedBy?: string[];
  time: string;
}

const SUPER_ADMIN_EMAIL = "adelbenmaza3@gmail.com";

export function ArticleCard({ 
  id, author, title, content, section, 
  tags = [], image, mediaUrls = [], likes = 0, comments = 0, 
  likedBy = [], savedBy = [], time 
}: ArticleCardProps) {
  const { isRtl } = useLanguage();
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const [isExpanded, setIsExpanded] = useState(false);

  const authorRef = useMemoFirebase(() => author.uid ? doc(db, "users", author.uid) : null, [db, author.uid]);
  const { data: liveAuthor } = useDoc<any>(authorRef);

  const isLiked = user ? (likedBy || []).includes(user.uid) : false;
  const isSaved = user ? (savedBy || []).includes(user.uid) : false;
  const isLong = content.length > 180;

  const displayAvatar = liveAuthor?.photoURL || author.photoURL;
  const displayName = liveAuthor?.displayName || author.name;
  const isVerified = liveAuthor?.isVerified || (liveAuthor?.email === SUPER_ADMIN_EMAIL);

  // دمج مصفوفة الصور لدعم الإصدار القديم والجديد
  const allImages = mediaUrls.length > 0 ? mediaUrls : (image ? [image] : []);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({ title: isRtl ? "يجب تسجيل الدخول للتفاعل" : "Sign in to interact" });
      return;
    }
    
    const articleRef = doc(db, "articles", id);
    const authorDocRef = doc(db, "users", author.uid);

    if (isLiked) {
      updateDoc(articleRef, { 
        likesCount: increment(-1), 
        likedBy: arrayRemove(user.uid),
        priorityScore: increment(-10) 
      });
      updateDoc(authorDocRef, { points: increment(-2) });
    } else {
      updateDoc(articleRef, { 
        likesCount: increment(1), 
        likedBy: arrayUnion(user.uid),
        priorityScore: increment(10) 
      });
      updateDoc(authorDocRef, { points: increment(2) });
      
      if (author.uid !== user.uid) {
        addDoc(collection(db, "notifications"), {
          userId: author.uid,
          type: "like",
          fromUserId: user.uid,
          fromUserName: user.displayName,
          fromUserAvatar: user.photoURL,
          message: isRtl ? "أعجب بمقالك القومي" : "liked your national article",
          read: false,
          createdAt: serverTimestamp()
        });
      }
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    const articleRef = doc(db, "articles", id);
    if (isSaved) {
      updateDoc(articleRef, { savedBy: arrayRemove(user.uid) });
      toast({ title: isRtl ? "تمت الإزالة من الأرشيف" : "Removed from archive" });
    } else {
      updateDoc(articleRef, { savedBy: arrayUnion(user.uid) });
      toast({ title: isRtl ? "تم الحفظ في الأرشيف القومي" : "Saved to National Archive" });
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
        <div className="flex items-center gap-1.5 bg-zinc-900 px-2 py-0.5 rounded-full border border-white/5">
          <Globe className="h-3 w-3 text-zinc-500" />
          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">{author.nationality}</span>
        </div>
      </div>

      <h2 className="text-lg font-black leading-tight mb-2 group-hover:text-primary transition-colors">{title}</h2>
      
      <div className="relative">
        <p className={cn(
          "text-sm text-zinc-400 font-medium leading-relaxed transition-all duration-300 whitespace-pre-wrap",
          !isExpanded && isLong ? "line-clamp-3" : ""
        )}>
          {content}
        </p>
        
        {isLong && (
          <button 
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            className="text-primary text-[10px] font-black uppercase mt-2 flex items-center gap-1 hover:underline active:scale-95 transition-transform"
          >
            {isExpanded ? (isRtl ? "عرض أقل" : "Show Less") : (isRtl ? "اقرأ المزيد" : "Read More")}
          </button>
        )}
      </div>

      {allImages.length > 0 && (
        <div className="mt-4" onClick={(e) => e.stopPropagation()}>
          {allImages.length > 1 ? (
            <Carousel className="w-full">
              <CarouselContent>
                {allImages.map((img, idx) => (
                  <CarouselItem key={idx}>
                    <div className="relative aspect-video rounded-2xl overflow-hidden border border-zinc-900 bg-zinc-900 shadow-2xl">
                      <img src={img} alt={`Slide ${idx}`} className="w-full h-full object-cover" />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="absolute inset-y-0 left-2 flex items-center">
                <CarouselPrevious className="h-8 w-8 bg-black/40 border-none text-white hover:bg-black/60" />
              </div>
              <div className="absolute inset-y-0 right-2 flex items-center">
                <CarouselNext className="h-8 w-8 bg-black/40 border-none text-white hover:bg-black/60" />
              </div>
            </Carousel>
          ) : (
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-zinc-900 bg-zinc-900 shadow-2xl">
              <img src={allImages[0]} alt="Article" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <Link href={`/profile/${author.uid}`} className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Avatar className="h-8 w-8 border-2 border-zinc-900 ring-1 ring-white/5">
              <AvatarImage src={displayAvatar} />
              <AvatarFallback className="text-[8px] bg-zinc-900">{displayName?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[11px] font-black text-zinc-300 truncate max-w-[80px]">@{displayName}</span>
              {isVerified && <VerificationBadge className="h-3.5 w-3.5" />}
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-6" onClick={(e) => e.stopPropagation()}>
          <button className={cn("flex items-center gap-1.5 transition-all active:scale-125", isLiked ? "text-primary" : "text-zinc-600 hover:text-white")} onClick={handleLike}>
            <ThumbsUp className={cn("h-4 w-4", isLiked && "fill-primary")} />
            <span className="text-xs font-black">{likes}</span>
          </button>
          <button className="flex items-center gap-1.5 text-zinc-600 hover:text-white transition-all active:scale-125" onClick={() => router.push(`/post/${id}`)}>
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs font-black">{comments}</span>
          </button>
          <button className={cn("transition-all active:scale-125", isSaved ? "text-primary" : "text-zinc-600 hover:text-white")} onClick={handleSave}>
            <Bookmark className={cn("h-4 w-4", isSaved && "fill-primary")} />
          </button>
        </div>
      </div>
    </div>
  );
}
