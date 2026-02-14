"use client";

import { Heart, MessageCircle, Repeat2, Share2, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { Badge } from "@/components/ui/badge";

interface PostCardProps {
  id: string;
  author: {
    name: string;
    handle: string;
    avatar: string;
  };
  content: string;
  image?: string;
  video?: string;
  likes: number;
  comments: number;
  reposts: number;
  time: string;
  isLamma?: boolean;
}

export function PostCard({ author, content, image, video, likes, comments, reposts, time, isLamma }: PostCardProps) {
  const { t, isRtl } = useLanguage();

  return (
    <Card className="mb-4 overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="p-4 flex flex-row items-center space-y-0 gap-3">
        <Avatar className="h-10 w-10 border">
          <AvatarImage src={author.avatar} />
          <AvatarFallback>{author.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-1">
            <h3 className="font-semibold text-sm truncate">{author.name}</h3>
            {isLamma && (
              <Badge variant="secondary" className="text-[10px] bg-accent/20 text-accent hover:bg-accent/30 border-none px-1.5 h-4">
                {t('lamma')}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">@{author.handle} • {time}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        <div className="px-4 pb-3">
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
        </div>
        
        {image && (
          <div className="relative aspect-video w-full bg-muted overflow-hidden">
            <img 
              src={image} 
              alt="Post content" 
              className="object-cover w-full h-full"
              loading="lazy"
            />
          </div>
        )}

        {video && (
          <div className="relative aspect-[9/16] max-h-[500px] w-full bg-black flex items-center justify-center">
            <video 
              src={video} 
              className="w-full h-full object-contain"
              controls 
              muted
            />
          </div>
        )}
      </CardContent>

      <CardFooter className="p-2 border-t flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-muted-foreground hover:text-primary">
            <Heart className="h-4 w-4" />
            <span className="text-xs">{likes}</span>
          </Button>
          <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-muted-foreground hover:text-primary">
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">{comments}</span>
          </Button>
          <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-muted-foreground hover:text-primary">
            <Repeat2 className="h-4 w-4" />
            <span className="text-xs">{reposts}</span>
          </Button>
        </div>
        <Button variant="ghost" size="sm" className="h-9 text-muted-foreground">
          <Share2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
