
"use client";

import { Heart, MessageCircle, MessageSquare, MoreHorizontal, Send, Loader2, X, Trash2, Mic, CheckCircle2, Ban } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { useState, useEffect } from "react";
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { doc, updateDoc, arrayUnion, arrayRemove, onSnapshot, collection, addDoc, serverTimestamp, query, orderBy, limit, deleteDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const ADMIN_EMAIL = "adelbenmaza3@gmail.com";

interface PostCardProps {
  id: string;
  author: {
    name: string;
    handle: string;
    avatar: string;
    uid?: string;
    isVerified?: boolean;
    role?: string;
    email?: string;
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
    textEffect?: string;
    textX?: number;
    textY?: number;
    stickers?: any[];
  };
}

export function PostCard({ id, author, content, image, mediaType, likes: initialLikes, time, mediaSettings }: PostCardProps) {
  const { isRtl } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  
  const userProfileRef = useMemoFirebase(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: currentUserProfile } = useDoc<any>(userProfileRef);
  const isBanned = currentUserProfile?.isBannedUntil && currentUserProfile.isBannedUntil.toDate() > new Date();

  const [likesCount, setLikesCount] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [postAuthorId, setPostAuthorId] = useState<string | null>(author.uid || null);

  const commentsQuery = useMemoFirebase(() => {
    if (!id) return null;
    return query(collection(db, "posts", id, "comments"), orderBy("createdAt", "desc"), limit(50));
  }, [db, id]);
  const { data: comments = [], loading: commentsLoading } = useCollection<any>(commentsQuery);

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
    if (!user || !id || isBanned) {
      if (isBanned) toast({ variant: "destructive", title: isRtl ? "محظور" : "Banned" });
      return;
    }
    const postRef = doc(db, "posts", id);
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikesCount(prev => wasLiked ? prev - 1 : prev + 1);

    if (wasLiked) {
      updateDoc(postRef, { likedBy: arrayRemove(user.uid) });
    } else {
      updateDoc(postRef, { likedBy: arrayUnion(user.uid) });
    }
  };

  const handleAddComment = async () => {
    if (isBanned) {
      toast({ variant: "destructive", title: isRtl ? "لا يمكنك التعليق حالياً" : "Restricted" });
      return;
    }
    if (!newComment.trim() || !user || !id) return;
    addDoc(collection(db, "posts", id, "comments"), {
      authorId: user.uid,
      authorName: user.displayName || "User",
      authorAvatar: user.photoURL || "",
      authorHandle: user.email?.split('@')[0] || "user",
      text: newComment,
      createdAt: serverTimestamp()
    });
    setNewComment("");
  };

  const showVerification = author.isVerified && author.email !== ADMIN_EMAIL;

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
              <div className="flex items-center gap-1">
                <h3 className="font-bold text-sm truncate hover:underline">{author.name}</h3>
                {showVerification && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#1DA1F2] fill-[#1DA1F2] text-black" />
                )}
              </div>
              <span className="text-[10px] text-zinc-500">@{author.handle}</span>
            </div>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="px-4 pb-3 text-[15px] leading-snug">
          <p className={cn("whitespace-pre-wrap", !isExpanded && content.length > 180 ? "line-clamp-3" : "")}>
            {content}
          </p>
        </div>

        {image && (
          <div className="px-4 mb-2">
            <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/40 aspect-video md:aspect-auto">
              <img src={image} alt="Post" className={cn("w-full h-auto max-h-[600px] object-cover", mediaSettings?.filter || "filter-none")} />
            </div>
          </div>
        )}

        <div className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5 group cursor-pointer" onClick={handleLike}>
                <Heart className={cn("h-5 w-5", isLiked ? "fill-red-500 text-red-500" : "text-zinc-500")} />
                <span className={cn("text-xs font-bold", isLiked ? "text-red-500" : "text-zinc-500")}>{likesCount}</span>
              </div>
              
              <Sheet>
                <SheetTrigger asChild>
                  <div className="flex items-center gap-1.5 group cursor-pointer">
                    <MessageCircle className="h-5 w-5 text-zinc-500" />
                    <span className="text-xs font-bold text-zinc-500">{comments.length}</span>
                  </div>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[80vh] bg-zinc-950 border-zinc-800 rounded-t-[2.5rem] p-0 flex flex-col outline-none">
                  <SheetHeader className="p-6 border-b border-zinc-900 sticky top-0 bg-zinc-950/80 backdrop-blur-md z-10">
                    <div className="flex justify-between items-center">
                      <SheetClose asChild><Button variant="ghost" size="icon"><X className="h-5 w-5" /></Button></SheetClose>
                      <SheetTitle className="text-white font-black">{isRtl ? "النقاشات" : "Discussions"}</SheetTitle>
                      <div className="w-10" />
                    </div>
                  </SheetHeader>
                  <ScrollArea className="flex-1 p-6">
                    {comments.map((comment: any) => (
                      <div key={comment.id} className="flex gap-4 mb-6">
                        <Avatar className="h-9 w-9"><AvatarImage src={comment.authorAvatar} /></Avatar>
                        <div className="flex-1 bg-zinc-900/40 p-4 rounded-2xl border border-white/5">
                          <p className="text-[11px] font-black text-zinc-500 mb-1">@{comment.authorHandle}</p>
                          <p className="text-sm text-zinc-100 leading-relaxed">{comment.text}</p>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                  <div className="p-6 border-t border-zinc-900 bg-zinc-950 pb-10">
                    {isBanned ? (
                      <div className="bg-red-500/10 p-3 rounded-xl flex items-center gap-2 text-red-500 text-xs font-bold border border-red-500/20">
                        <Ban className="h-4 w-4" />
                        {isRtl ? "ميزة التعليق متوقفة حالياً لحسابك" : "Commenting disabled for your account"}
                      </div>
                    ) : (
                      <div className="flex gap-3 items-center">
                        <Input 
                          placeholder={isRtl ? "أضف رأيك..." : "Add your opinion..."} 
                          className="bg-zinc-900 border-none rounded-full h-12 px-6" 
                          value={newComment} 
                          onChange={(e) => setNewComment(e.target.value)} 
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                        />
                        <Button size="icon" className="rounded-full h-12 w-12 bg-primary shadow-xl" onClick={handleAddComment} disabled={!newComment.trim()}>
                          <Send className="h-5 w-5" />
                        </Button>
                      </div>
                    )}
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
