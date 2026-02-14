
"use client";

import { Heart, MessageCircle, Repeat2, Share2, MoreHorizontal, Languages, Send, Loader2, X, Info, ThumbsUp, ThumbsDown, MessageSquare, Trash2, Mic } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { useState, useEffect } from "react";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, arrayUnion, arrayRemove, onSnapshot, collection, addDoc, serverTimestamp, query, orderBy, limit, deleteDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";

interface PostCardProps {
  id: string;
  author: {
    name: string;
    handle: string;
    avatar: string;
    uid?: string;
  };
  content: string;
  image?: string;
  mediaType?: "image" | "video" | "audio";
  likes: number;
  comments: number;
  reposts: number;
  time: string;
}

export function PostCard({ id, author, content, image, mediaType, likes: initialLikes, comments: initialCommentsCount, reposts, time }: PostCardProps) {
  const { isRtl } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useUser();
  const db = useFirestore();
  
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [postAuthorId, setPostAuthorId] = useState<string | null>(author.uid || null);

  const commentsQuery = useMemoFirebase(() => {
    if (!id) return null;
    return query(collection(db, "posts", id, "comments"), orderBy("createdAt", "desc"), limit(50));
  }, [db, id]);
  const { data: comments, loading: commentsLoading } = useCollection<any>(commentsQuery);

  useEffect(() => {
    if (!id || !db) return;
    const postRef = doc(db, "posts", id);
    const unsubscribe = onSnapshot(postRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const likedBy = data.likedBy || [];
        setLikesCount(likedBy.length);
        setPostAuthorId(data.authorId || null);
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
    
    // تفاعل لحظي (Optimistic Update)
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikesCount(prev => wasLiked ? prev - 1 : prev + 1);

    if (wasLiked) {
      updateDoc(postRef, { likedBy: arrayRemove(user.uid) });
    } else {
      updateDoc(postRef, { likedBy: arrayUnion(user.uid) });
      
      if (postAuthorId && postAuthorId !== user.uid) {
        addDoc(collection(db, "notifications"), {
          userId: postAuthorId,
          type: "like",
          fromUserId: user.uid,
          fromUserName: user.displayName || "Someone",
          fromUserAvatar: user.photoURL || "",
          postId: id,
          read: false,
          createdAt: serverTimestamp()
        });
      }
    }
  };

  const handleDelete = async () => {
    if (!id || !db || !user || postAuthorId !== user.uid) return;
    
    if (confirm(isRtl ? "هل أنت متأكد من حذف هذا المنشور؟" : "Are you sure you want to delete this post?")) {
      try {
        await deleteDoc(doc(db, "posts", id));
        toast({
          title: isRtl ? "تم الحذف" : "Deleted",
          description: isRtl ? "تم حذف المنشور بنجاح" : "Post deleted successfully",
        });
      } catch (error) {
        console.error("Error deleting post:", error);
      }
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user || !id) return;
    
    const commentData = {
      authorId: user.uid,
      authorName: user.displayName || "User",
      authorAvatar: user.photoURL || "",
      authorHandle: user.email?.split('@')[0] || "user",
      text: newComment,
      createdAt: serverTimestamp()
    };

    addDoc(collection(db, "posts", id, "comments"), commentData);
    
    if (postAuthorId && postAuthorId !== user.uid) {
      addDoc(collection(db, "notifications"), {
        userId: postAuthorId,
        type: "comment",
        fromUserId: user.uid,
        fromUserName: user.displayName || "Someone",
        fromUserAvatar: user.photoURL || "",
        postId: id,
        read: false,
        createdAt: serverTimestamp()
      });
    }

    setNewComment("");
  };

  return (
    <Card className="bg-black text-white border-none rounded-none mb-2 border-b border-zinc-900">
      <CardHeader className="p-4 flex flex-row items-center space-y-0 gap-3">
        <Link href={`/profile/${postAuthorId || '#'}`}>
          <Avatar className="h-10 w-10 border-none cursor-pointer">
            <AvatarImage src={author.avatar} />
            <AvatarFallback>{author.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 overflow-hidden">
          <Link href={`/profile/${postAuthorId || '#'}`}>
            <div className="flex items-center gap-1 cursor-pointer">
              <h3 className="font-bold text-sm truncate hover:underline">{author.name}</h3>
              <span className="text-xs text-muted-foreground">@{author.handle}</span>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {user && postAuthorId === user.uid && (
            <Button variant="ghost" size="icon" onClick={handleDelete} className="text-zinc-600 hover:text-red-500 h-8 w-8">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-8 w-8">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
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
          <div className="px-4">
            {mediaType === "audio" ? (
              <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center animate-pulse">
                  <Mic className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                   <audio controls src={image} className="w-full h-8 brightness-90 contrast-125" />
                </div>
              </div>
            ) : mediaType === "video" ? (
              <div className="relative w-full bg-zinc-900 overflow-hidden rounded-2xl border border-zinc-800">
                <video src={image} controls className="w-full h-auto max-h-[500px]" />
              </div>
            ) : (
              <div className="relative w-full bg-zinc-900 overflow-hidden">
                <img 
                  src={image} 
                  alt="Post content" 
                  className="w-full h-auto max-h-[500px] object-cover rounded-2xl border border-zinc-800"
                  loading="lazy"
                />
              </div>
            )}
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
              
              <Sheet>
                <SheetTrigger asChild>
                  <div className="flex items-center gap-1.5 group cursor-pointer text-zinc-500 hover:text-primary transition-colors">
                    <MessageCircle className="h-5 w-5" />
                    <span className="text-xs font-medium">{comments.length}</span>
                  </div>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[90vh] bg-zinc-950 border-zinc-800 rounded-t-[32px] p-0 flex flex-col focus:outline-none">
                  <SheetHeader className="p-4 flex flex-row items-center justify-between border-b border-zinc-900 sticky top-0 bg-zinc-950/95 backdrop-blur-md z-10 rounded-t-[32px]">
                    <div className="flex items-center gap-4">
                      <SheetClose asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full h-8 w-8">
                          <X className="h-5 w-5" />
                        </Button>
                      </SheetClose>
                      <Info className="h-5 w-5 text-white" />
                    </div>
                    <SheetTitle className="text-white font-bold text-lg">
                      {isRtl ? "التعليقات" : "Comments"}
                    </SheetTitle>
                    <div className="w-10" /> 
                  </SheetHeader>
                  
                  <div className="p-4 flex gap-2 overflow-x-auto no-scrollbar border-b border-zinc-900 bg-zinc-950/50">
                    <Button variant="secondary" size="sm" className="rounded-xl h-8 px-4 font-bold bg-white text-black hover:bg-zinc-200">
                      {isRtl ? "الأهم" : "Top"}
                    </Button>
                    <Button variant="ghost" size="sm" className="rounded-xl h-8 px-4 font-bold text-zinc-400 hover:bg-zinc-900">
                      {isRtl ? "المواضيع" : "Topics"}
                    </Button>
                    <Button variant="ghost" size="sm" className="rounded-xl h-8 px-4 font-bold text-zinc-400 hover:bg-zinc-900">
                      {isRtl ? "أحدث التعليقات" : "Newest"}
                    </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar pb-32">
                    {commentsLoading ? (
                      <div className="flex justify-center p-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : comments.length > 0 ? (
                      comments.map((comment: any) => (
                        <div key={comment.id} className="relative group">
                          <div className={cn("flex gap-3", isRtl ? "flex-row" : "flex-row-reverse")}>
                            <div className="flex-1 space-y-2">
                              <div className={cn("flex items-center gap-2 text-[11px] text-zinc-500", isRtl ? "flex-row" : "flex-row-reverse")}>
                                <span className="font-medium">@{comment.authorHandle || "user"}</span>
                                <span>•</span>
                                <span>{comment.createdAt?.toDate ? "2m ago" : "just now"}</span>
                                <Button variant="ghost" size="icon" className="h-4 w-4 text-zinc-600 hover:text-white ml-auto">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </div>
                              <p className={cn("text-sm text-zinc-200 leading-relaxed", isRtl ? "text-right" : "text-left")}>
                                {comment.text}
                              </p>
                            </div>
                            <Link href={`/profile/${comment.authorId || '#'}`}>
                              <Avatar className="h-9 w-9 shrink-0 border border-zinc-800 shadow-sm cursor-pointer">
                                <AvatarImage src={comment.authorAvatar} />
                                <AvatarFallback>{comment.authorName?.[0]}</AvatarFallback>
                              </Avatar>
                            </Link>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full opacity-40">
                        <MessageSquare className="h-12 w-12 mb-2" />
                        <p className="text-sm">
                          {isRtl ? "لا توجد تعليقات بعد" : "No comments yet"}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 bg-zinc-950 border-t border-zinc-900 absolute bottom-0 left-0 right-0 z-20 shadow-[0_-8px_20px_rgba(0,0,0,0.5)]">
                    <div className={cn("flex gap-3 items-center", isRtl ? "flex-row" : "flex-row-reverse")}>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.photoURL || ""} />
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 relative">
                        <Input 
                          placeholder={isRtl ? "إضافة تعليق..." : "Add a comment..."} 
                          className="bg-zinc-900 border-none rounded-xl h-11 text-sm focus-visible:ring-1 focus-visible:ring-primary pl-4 pr-12"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                        />
                        <Button 
                          size="icon" 
                          variant="ghost"
                          className="absolute right-1 top-1 text-primary hover:bg-transparent" 
                          onClick={handleAddComment}
                          disabled={!newComment.trim()}
                        >
                          <Send className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

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
