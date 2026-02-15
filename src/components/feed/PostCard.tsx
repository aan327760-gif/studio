
"use client";

import { Heart, MessageCircle, MoreHorizontal, Send, X, Trash2, CheckCircle2, Ban, Flag } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { useState, useEffect } from "react";
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  onSnapshot, 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  limit, 
  deleteDoc 
} from "firebase/firestore";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  
  const userProfileRef = useMemoFirebase(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: currentUserProfile } = useDoc<any>(userProfileRef);
  const isBanned = currentUserProfile?.isBannedUntil && currentUserProfile.isBannedUntil.toDate() > new Date();
  const isAdmin = currentUserProfile?.role === "admin" || user?.email === "adelbenmaza3@gmail.com";

  const [likesCount, setLikesCount] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [postAuthorId, setPostAuthorId] = useState<string | null>(author.uid || null);

  const commentsQuery = useMemoFirebase(() => {
    if (!id) return null;
    return query(collection(db, "posts", id, "comments"), orderBy("createdAt", "desc"), limit(50));
  }, [db, id]);
  const { data: comments = [] } = useCollection<any>(commentsQuery);

  useEffect(() => {
    if (!id || !db) return;
    const postRef = doc(db, "posts", id);
    const unsubscribe = onSnapshot(postRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const likedBy = data.likedBy || [];
        setLikesCount(likedBy.length);
        setPostAuthorId(data.authorId || null);
        if (user) setIsLiked(likedBy.includes(user.uid));
      }
    });
    return () => unsubscribe();
  }, [id, db, user]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !id || isBanned) return;
    const postRef = doc(db, "posts", id);
    if (isLiked) {
      updateDoc(postRef, { likedBy: arrayRemove(user.uid) });
    } else {
      updateDoc(postRef, { likedBy: arrayUnion(user.uid) });
    }
  };

  const handleAddComment = async () => {
    if (isBanned || !newComment.trim() || !user || !id) return;
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

  const handleReport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !id) return;
    try {
      await addDoc(collection(db, "reports"), {
        targetId: id,
        targetType: "post",
        reason: isRtl ? "محتوى غير لائق" : "Inappropriate content",
        reportedBy: user.uid,
        status: "pending",
        createdAt: serverTimestamp()
      });
      toast({ title: isRtl ? "تم إرسال البلاغ" : "Report sent" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error" });
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin || !id) return;
    if (confirm(isRtl ? "حذف هذا المنشور؟" : "Delete this post?")) {
      await deleteDoc(doc(db, "posts", id));
      toast({ title: "Deleted" });
    }
  };

  return (
    <Card className="bg-black text-white border-none rounded-none border-b border-zinc-900/50 cursor-pointer active:bg-zinc-950/50 transition-colors" onClick={() => router.push(`/post/${id}`)}>
      <CardHeader className="p-4 pb-2 flex flex-row items-center space-y-0 gap-3">
        <Link href={`/profile/${postAuthorId || '#'}`} onClick={(e) => e.stopPropagation()}>
          <Avatar className="h-10 w-10 ring-1 ring-zinc-800">
            <AvatarImage src={author.avatar} />
            <AvatarFallback>{author.name?.[0]}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <Link href={`/profile/${postAuthorId || '#'}`} onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <h3 className="font-bold text-sm truncate">{author.name}</h3>
                  {author.isVerified && <CheckCircle2 className="h-3 w-3 text-[#1DA1F2] fill-[#1DA1F2]" />}
                </div>
                <span className="text-[10px] text-zinc-500">@{author.handle}</span>
              </div>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-600"><MoreHorizontal className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-900 text-white">
                <DropdownMenuItem onClick={handleReport} className="flex gap-2 text-orange-500">
                  <Flag className="h-4 w-4" /> {isRtl ? "إبلاغ" : "Report"}
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={handleDelete} className="flex gap-2 text-red-500">
                    <Trash2 className="h-4 w-4" /> {isRtl ? "حذف" : "Delete"}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="px-4 pb-3 text-[15px] leading-snug">
          <p className="whitespace-pre-wrap">{content}</p>
        </div>

        {image && (
          <div className="px-4 mb-2">
            <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/40">
              <img src={image} alt="Post" className={cn("w-full h-auto max-h-[500px] object-cover", mediaSettings?.filter || "filter-none")} />
            </div>
          </div>
        )}

        <div className="px-4 py-3 flex items-center gap-6" onClick={(e) => e.stopPropagation()}>
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
            <SheetContent side="bottom" className="h-[70vh] bg-zinc-950 border-zinc-800 rounded-t-[2.5rem] p-0 outline-none">
              <SheetHeader className="p-6 border-b border-zinc-900">
                <SheetTitle className="text-white font-black text-center">{isRtl ? "النقاشات" : "Discussions"}</SheetTitle>
              </SheetHeader>
              <ScrollArea className="flex-1 p-6 h-[calc(70vh-140px)]">
                {comments.map((comment: any) => (
                  <div key={comment.id} className="flex gap-4 mb-6">
                    <Avatar className="h-8 w-8"><AvatarImage src={comment.authorAvatar} /></Avatar>
                    <div className="flex-1 bg-zinc-900/50 p-3 rounded-2xl">
                      <p className="text-[10px] font-bold text-zinc-500">@{comment.authorHandle}</p>
                      <p className="text-sm text-zinc-200">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </ScrollArea>
              <div className="p-4 border-t border-zinc-900 bg-zinc-950">
                {isBanned ? (
                  <div className="p-2 text-center text-[10px] text-red-500 font-bold bg-red-500/10 rounded-xl">
                    {isRtl ? "أنت محظور من التعليق حالياً" : "You are restricted from commenting"}
                  </div>
                ) : (
                  <div className="flex gap-2 items-center">
                    <Input 
                      placeholder={isRtl ? "أضف تعليقاً..." : "Add a comment..."} 
                      className="bg-zinc-900 border-none rounded-full h-10" 
                      value={newComment} 
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <Button size="icon" className="rounded-full h-10 w-10 bg-primary" onClick={handleAddComment} disabled={!newComment.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </CardContent>
    </Card>
  );
}
