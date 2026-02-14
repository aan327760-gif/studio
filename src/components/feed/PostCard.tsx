
"use client";

import { Heart, MessageCircle, Repeat2, Share2, MoreHorizontal, Languages } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { useState } from "react";

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

export function PostCard({ author, content, image, likes, comments, reposts, time }: PostCardProps) {
  const { isRtl } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="bg-black text-white border-none rounded-none mb-2">
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
        {image && (
          <div className="relative w-full bg-zinc-900 overflow-hidden">
            <img 
              src={image} 
              alt="Post content" 
              className="w-full h-auto max-h-[600px] object-contain"
              loading="lazy"
            />
          </div>
        )}

        <div className="p-4 space-y-3">
          {/* Interaction Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 group cursor-pointer">
                <Heart className="h-6 w-6 text-white group-hover:text-red-500 transition-colors" />
                <span className="text-sm font-medium">{likes}</span>
              </div>
              <MessageCircle className="h-6 w-6 text-white cursor-pointer" />
              <Repeat2 className="h-6 w-6 text-white cursor-pointer" />
            </div>
            <Share2 className="h-6 w-6 text-white cursor-pointer" />
          </div>

          {/* Description */}
          <div className="text-sm leading-relaxed">
            <p className={!isExpanded ? "line-clamp-2" : ""}>
              {content}
            </p>
            {!isExpanded && (
              <button 
                onClick={() => setIsExpanded(true)}
                className="text-primary font-semibold mt-1"
              >
                Show more
              </button>
            )}
          </div>

          {/* Translation */}
          <div className="flex items-center gap-2 text-primary text-xs font-semibold cursor-pointer">
            <Languages className="h-4 w-4" />
            <span>Translate</span>
          </div>

          {/* Add Comment */}
          <div className="text-muted-foreground text-xs py-1">
            Add first comment
          </div>

          {/* Timestamp */}
          <div className="text-[10px] text-muted-foreground text-right uppercase tracking-wider">
            {time}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
