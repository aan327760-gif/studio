
"use client";

import { Heart, MessageCircle, MessageSquare, Repeat2, Share2, MoreHorizontal, Languages, Send, Loader2, X, Info, Trash2, Mic, PlayCircle } from "lucide-react";
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
import { useRouter } from "next/navigation";

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
  mediaSettings?: {
    filter?: string;
    textOverlay?: string;
    textColor?: string;
    textBg?: boolean;
  };
}

export function PostCard({ id, author, content, image, mediaType, likes: initialLikes, reposts, time, mediaSettings }: PostCardProps) {
  const { isRtl } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  
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

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !id) return;
    const postRef = doc(db, "posts", id);
    
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

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const navigateToDetail = () => {
    router.push(`/post/${id}`);
  };

  return (
    <Card className="bg-black text-white border-none rounded-none border-b border-zinc-900/50 cursor-pointer active:bg-zinc-950/50 transition-colors" onClick={navigateToDetail}>
      <CardHeader className="p-4 pb-2 flex flex-row items-center space-y-0 gap-3" onClick={(e) => e.stopPropagation()}>
        <Link href={`/profile/${postAuthorId || '#'}`}>
          <Avatar className="h-10 w-10 ring-1 ring-zinc-800 ring-offset-1 ring-offset-black">
            <AvatarImage src={author.avatar} />
            <AvatarFallback>{author.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 overflow-hidden">
          <Link href={`/profile/${postAuthorId || '#'}`}>
            <div className="flex flex-col">
              <h3 className="font-bold text-sm truncate hover:underline">{author.name}</h3>
              <span className="text-[10px] text-zinc-500">@{author.handle}</span>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-1">
          {user && postAuthorId === user.uid && (
            <Button variant="ghost" size="icon" onClick={handleDelete} className="text-zinc-600 hover:text-red-500 h-8 w-8 rounded-full">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-white h-8 w-8 rounded-full">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="px-4 pb-3 text-[15px] leading-snug">
          <p className={cn("whitespace-pre-wrap", !isExpanded && content.length > 180 ? "line-clamp-3" : "")}>
            {content}
          </p>
          {!isExpanded && content.length > 180 && (
            <button 
              onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
              className="text-primary text-xs font-bold mt-1"
            >
              {isRtl ? "عرض المزيد" : "Show more"}
            </button>
          )}
        </div>

        {image && (
          <div className="px-4 mb-2">
            <div className="relative rounded-2xl overflow-hidden border border-zinc-900 bg-zinc-900/40" onClick={(e) => e.stopPropagation()}>
              {mediaType === "audio" ? (
                <div className="p-4 flex items-center gap-4 bg-gradient-to-br from-zinc-900 to-black">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary shadow-inner">
                    <Mic className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                     <audio controls src={image} className="w-full h-10 brightness-90 filter invert" />
                  </div>
                </div>
              ) : mediaType === "video" ? (
                <div className="relative group aspect-video bg-black flex items-center justify-center">
                  <video src={image} controls className="w-full h-full max-h-[500px]" />
                  {mediaSettings?.textOverlay && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
                      <span className={cn(
                        "text-lg font-black text-center px-3 py-1.5 rounded-xl break-words max-w-full drop-shadow-2xl",
                        mediaSettings.textColor || "text-white",
                        mediaSettings.textBg ? "bg-black/50 backdrop-blur-sm" : ""
                      )}>
                        {mediaSettings.textOverlay}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <img 
                    src={image} 
                    alt="Post media" 
                    className={cn("w-full h-auto max-h-[600px] object-cover hover:opacity-95 transition-all", mediaSettings?.filter || "filter-none")}
                    loading="lazy"
                  />
                  {mediaSettings?.textOverlay && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
                      <span className={cn(
                        "text-lg font-black text-center px-3 py-1.5 rounded-xl break-words max-w-full drop-shadow-2xl",
                        mediaSettings.textColor || "text-white",
                        mediaSettings.textBg ? "bg-black/50 backdrop-blur-sm" : ""
                      )}>
                        {mediaSettings.textOverlay}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div 
                className="flex items-center gap-1.5 group cursor-pointer transition-colors"
                onClick={handleLike}
              >
                <div className={cn(
                  "p-2 rounded-full transition-colors",
                  isLiked ? "bg-red-500/10" : "group-hover:bg-red-500/10"
                )}>
                  <Heart 
                    className={cn(
                      "h-5 w-5 transition-all",
                      isLiked ? "fill-red-500 text-red-500 scale-110" : "text-zinc-500 group-hover:text-red-500"
                    )} 
                  />
                </div>
                <span className={cn("text-xs font-bold", isLiked ? "text-red-500" : "text-zinc-500")}>
                  {likesCount}
                </span>
              </div>
              
              <Sheet>
                <SheetTrigger asChild>
                  <div className="flex items-center gap-1.5 group cursor-pointer transition-colors">
                    <div className="p-2 rounded-full group-hover:bg-primary/10">
                      <MessageCircle className="h-5 w-5 text-zinc-500 group-hover:text-primary" />
                    </div>
                    <span className="text-xs font-bold text-zinc-500 group-hover:text-primary">{comments.length}</span>
                  </div>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[90vh] bg-zinc-950 border-zinc-800 rounded-t-[2.5rem] p-0 flex flex-col focus:outline-none">
                  <SheetHeader className="p-5 border-b border-zinc-900 glass rounded-t-[2.5rem] sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                      <SheetClose asChild>
                        <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                          <X className="h-5 w-5" />
                        </Button>
                      </SheetClose>
                      <SheetTitle className="text-white font-bold">{isRtl ? "التعليقات" : "Comments"}</SheetTitle>
                      <div className="w-9" />
                    </div>
                  </SheetHeader>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar pb-32">
                    {commentsLoading ? (
                      <div className="flex justify-center p-10">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : comments.length > 0 ? (
                      comments.map((comment: any) => (
                        <div key={comment.id} className={cn("flex gap-3", isRtl && "flex-row-reverse")}>
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={comment.authorAvatar} />
                            <AvatarFallback>{comment.authorName?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className={cn("flex-1 bg-zinc-900/50 p-3 rounded-2xl", isRtl ? "text-right" : "text-left")}>
                            <p className="text-[11px] font-bold text-zinc-400 mb-1">@{comment.authorHandle}</p>
                            <p className="text-sm text-zinc-200">{comment.text}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-40 opacity-20">
                        <MessageSquare className="h-10 w-10 mb-2" />
                        <p className="text-xs">{isRtl ? "لا توجد تعليقات بعد" : "No comments yet"}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 glass border-t border-zinc-900 absolute bottom-0 left-0 right-0 z-20">
                    <div className={cn("flex gap-2 items-center", isRtl && "flex-row-reverse")}>
                      <Input 
                        placeholder={isRtl ? "أضف تعليقاً..." : "Add a comment..."} 
                        className="bg-zinc-900 border-none rounded-full h-11 px-5"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                      />
                      <Button size="icon" className="rounded-full h-11 w-11 shrink-0 bg-primary" onClick={handleAddComment} disabled={!newComment.trim()}>
                        <Send className={cn("h-5 w-5", isRtl && "rotate-180")} />
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <div className="flex items-center gap-1.5 group cursor-pointer transition-colors">
                <div className="p-2 rounded-full group-hover:bg-green-500/10">
                  <Repeat2 className="h-5 w-5 text-zinc-500 group-hover:text-green-500" />
                </div>
                <span className="text-xs font-bold text-zinc-500 group-hover:text-green-500">{reposts}</span>
              </div>
            </div>
            
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 text-zinc-500 hover:text-white" onClick={(e) => {
              e.stopPropagation();
              if (navigator.share) {
                navigator.share({ title: 'Unbound Post', url: `${window.location.origin}/post/${id}` });
              } else {
                navigator.clipboard.writeText(`${window.location.origin}/post/${id}`);
                toast({ title: isRtl ? "تم النسخ" : "Link Copied" });
              }
            }}>
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center justify-between text-[9px] text-zinc-600 font-bold uppercase tracking-widest mt-1">
             <div className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer">
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
