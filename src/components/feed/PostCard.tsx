
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
import { ScrollArea } from "@/components/ui/scroll-area";
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
    textX?: number;
    textY?: number;
    stickers?: any[];
  };
}

export function PostCard({ id, author, content, image, mediaType, likes: initialLikes, reposts, time, mediaSettings }: PostCardProps) {
  const { isRtl } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = userUser();
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
        toast({ title: isRtl ? "تم الحذف" : "Deleted", description: isRtl ? "تم حذف المنشور بنجاح" : "Post deleted successfully" });
      } catch (error) {}
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user || !id) return;
    addDoc(collection(db, "posts", id, "comments"), {
      authorId: user.uid,
      authorName: user.displayName || "User",
      authorAvatar: user.photoURL || "",
      authorHandle: user.email?.split('@')[0] || "user",
      text: newComment,
      createdAt: serverTimestamp()
    });
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
    <Card className="bg-black text-white border-none rounded-none border-b border-zinc-900/50 cursor-pointer active:bg-zinc-950/50 transition-colors" onClick={() => router.push(`/post/${id}`)}>
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
            <button onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }} className="text-primary text-xs font-bold mt-1">
              {isRtl ? "عرض المزيد" : "Show more"}
            </button>
          )}
        </div>

        {image && (
          <div className="px-4 mb-2">
            <div className="relative rounded-2xl overflow-hidden border border-zinc-900 bg-zinc-900/40 aspect-video md:aspect-auto" onClick={(e) => e.stopPropagation()}>
              {mediaType === "audio" ? (
                <div className="p-4 flex items-center gap-4 bg-zinc-900">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary"><Mic className="h-6 w-6" /></div>
                  <div className="flex-1"><audio controls src={image} className="w-full h-10 brightness-90 filter invert" /></div>
                </div>
              ) : mediaType === "video" ? (
                <div className="relative w-full aspect-video bg-black">
                  <video src={image} controls className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="relative w-full">
                  <img src={image} alt="Post" className={cn("w-full h-auto max-h-[600px] object-cover", mediaSettings?.filter || "filter-none")} />
                </div>
              )}

              <div className="absolute inset-0 pointer-events-none">
                {mediaSettings?.textOverlay && (
                  <div className="absolute" style={{ left: `${mediaSettings.textX ?? 50}%`, top: `${mediaSettings.textY ?? 50}%`, transform: 'translate(-50%, -50%)' }}>
                    <span className={cn("text-base font-black text-center px-3 py-1.5 rounded-lg drop-shadow-xl", mediaSettings.textColor || "text-white", mediaSettings.textBg ? "bg-black/50 backdrop-blur-md" : "")}>
                      {mediaSettings.textOverlay}
                    </span>
                  </div>
                )}
                {mediaSettings?.stickers?.map((sticker: any, idx: number) => (
                  <div key={idx} className="absolute" style={{ 
                    left: `${sticker.x}%`, 
                    top: `${sticker.y}%`, 
                    transform: `translate(-50%, -50%) scale(${sticker.scale || 1}) rotate(${sticker.rotation || 0}deg)` 
                  }}>
                    <div className={cn("px-3 py-1 rounded-md font-black text-[10px] shadow-lg border border-white/10", sticker.color || "bg-white text-black")}>
                      {sticker.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5 group cursor-pointer" onClick={handleLike}>
                <div className={cn("p-2 rounded-full", isLiked ? "bg-red-500/10" : "group-hover:bg-red-500/10")}>
                  <Heart className={cn("h-5 w-5", isLiked ? "fill-red-500 text-red-500 scale-110" : "text-zinc-500 group-hover:text-red-500")} />
                </div>
                <span className={cn("text-xs font-bold", isLiked ? "text-red-500" : "text-zinc-500")}>{likesCount}</span>
              </div>
              
              <Sheet>
                <SheetTrigger asChild>
                  <div className="flex items-center gap-1.5 group cursor-pointer">
                    <div className="p-2 rounded-full group-hover:bg-primary/10"><MessageCircle className="h-5 w-5 text-zinc-500 group-hover:text-primary" /></div>
                    <span className="text-xs font-bold text-zinc-500 group-hover:text-primary">{comments.length}</span>
                  </div>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[80vh] bg-zinc-950 border-zinc-800 rounded-t-[2rem] p-0 flex flex-col outline-none">
                  <SheetHeader className="p-4 border-b border-zinc-900 sticky top-0 bg-zinc-950/80 backdrop-blur-md z-10">
                    <div className="flex justify-between items-center">
                      <SheetClose asChild><Button variant="ghost" size="icon"><X className="h-5 w-5" /></Button></SheetClose>
                      <SheetTitle className="text-white font-bold">{isRtl ? "التعليقات" : "Comments"}</SheetTitle>
                      <div className="w-10" />
                    </div>
                  </SheetHeader>
                  <ScrollArea className="flex-1 p-4">
                    {commentsLoading ? <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> :
                      comments.length > 0 ? comments.map((comment: any) => (
                        <div key={comment.id} className="flex gap-3 mb-6">
                          <Avatar className="h-8 w-8"><AvatarImage src={comment.authorAvatar} /></Avatar>
                          <div className="flex-1 bg-zinc-900/50 p-3 rounded-2xl">
                            <p className="text-[11px] font-bold text-zinc-500 mb-1">@{comment.authorHandle}</p>
                            <p className="text-sm text-zinc-200">{comment.text}</p>
                          </div>
                        </div>
                      )) : <div className="text-center opacity-20 py-20"><MessageSquare className="h-10 w-10 mx-auto mb-2" /><p>{isRtl ? "لا توجد تعليقات بعد" : "No comments yet"}</p></div>
                    }
                  </ScrollArea>
                  <div className="p-4 border-t border-zinc-900 bg-zinc-950">
                    <div className="flex gap-2 items-center">
                      <Input placeholder={isRtl ? "أضف تعليقاً..." : "Add a comment..."} className="bg-zinc-900 border-none rounded-full h-11" value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                      <Button size="icon" className="rounded-full h-11 w-11 bg-primary" onClick={handleAddComment} disabled={!newComment.trim()}><Send className="h-5 w-5" /></Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
