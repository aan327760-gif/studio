
"use client";

import { Heart, MessageCircle, Repeat2, Share2, MoreHorizontal, Languages } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { useState, useEffect } from "react";
import { useFirestore, useUser } from "@/firebase";
import { doc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from "firebase/firestore";
import { cn } from "@/lib/utils";

interface PostCardProps {
  id: string;
  author: {
    name: string;
    handle: string;
    avatar: string;
  };
  content: string;
  image?: string;
  likes: number;
  comments: number;
  reposts: number;
  time: string;
}

export function PostCard({ id, author, content, image, likes: initialLikes, comments, reposts, time }: PostCardProps) {
  const { isRtl } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useUser();
  const db = useFirestore();
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (!id || !db) return;
    const postRef = doc(db, "posts", id);
    const unsubscribe = onSnapshot(postRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const likedBy = data.likedBy || [];
        setLikesCount(likedBy.length);
        if (user) {
          setIsLiked(likedBy.includes(user.uid));
        }
      }
    });
    return () => unsubscribe();
  }, [id, db, user]);

  const handleLike = async () => {
    if (!user || !id) return;
    const postRef = doc(db, "posts", id);
    if (isLiked) {
      updateDoc(postRef, {
        likedBy: arrayRemove(user.uid)
      });
    } else {
      updateDoc(postRef, {
        likedBy: arrayUnion(user.uid)
      });
    }
  };

  return (
    <Card className="bg-black text-white border-none rounded-none mb-2 border-b border-zinc-900">
      <CardHeader className="p-4 flex flex-row items-center space-y-0 gap-3">
        <Avatar className="h-10 w-10 border-none">
          <AvatarImage src={author.avatar} />
          <AvatarFallback>{author.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-1">
            <h3 className="font-bold text-sm truncate">{author.name}</h3>
            <span className="text-xs text-muted-foreground">@{author.handle}</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-8 w-8">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        <div className="px-4 pb-2 text-sm leading-relaxed">
          <p className={cn("whitespace-pre-wrap", !isExpanded && content.length > 150 ? "line-clamp-3" : "")}>
            {content}
          </p>
          {!isExpanded && content.length > 150 && (
            <button 
              onClick={() => setIsExpanded(true)}
              className="text-primary font-semibold mt-1"
            >
              {isRtl ? "عرض المزيد" : "Show more"}
            </button>
          )}
        </div>

        {image && (
          <div className="relative w-full bg-zinc-900 overflow-hidden px-4">
            <img 
              src={image} 
              alt="Post content" 
              className="w-full h-auto max-h-[500px] object-cover rounded-2xl border border-zinc-800"
              loading="lazy"
            />
          </div>
        )}

        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div 
                className="flex items-center gap-1.5 group cursor-pointer"
                onClick={handleLike}
              >
                <Heart 
                  className={cn(
                    "h-5 w-5 transition-all",
                    isLiked ? "fill-red-500 text-red-500 scale-110" : "text-zinc-500 group-hover:text-red-500"
                  )} 
                />
                <span className={cn("text-xs font-medium", isLiked ? "text-red-500" : "text-zinc-500")}>
                  {likesCount}
                </span>
              </div>
              <div className="flex items-center gap-1.5 group cursor-pointer text-zinc-500 hover:text-primary transition-colors">
                <MessageCircle className="h-5 w-5" />
                <span className="text-xs font-medium">{comments}</span>
              </div>
              <div className="flex items-center gap-1.5 group cursor-pointer text-zinc-500 hover:text-green-500 transition-colors">
                <Repeat2 className="h-5 w-5" />
                <span className="text-xs font-medium">{reposts}</span>
              </div>
            </div>
            <Share2 className="h-5 w-5 text-zinc-500 cursor-pointer hover:text-white" />
          </div>

          <div className="flex items-center justify-between text-[10px] text-zinc-600 uppercase tracking-wider">
            <div className="flex items-center gap-1 cursor-pointer hover:text-primary">
              <Languages className="h-3 w-3" />
              <span>{isRtl ? "ترجمة" : "Translate"}</span>
            </div>
            <span>{time}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
