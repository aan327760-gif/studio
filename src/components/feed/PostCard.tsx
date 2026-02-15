
"use client";

import { Heart, MessageCircle, MoreHorizontal, Send, Trash2, Flag } from "lucide-react";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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
import { VerificationBadge } from "@/components/ui/verification-badge";

interface PostCardProps {
  id: string;
  author: any;
  content: string;
  image?: string;
  mediaType?: "image" | "video" | "audio";
  likes: number;
  time: string;
  mediaSettings?: any;
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

  const isAuthorVerified = author?.isVerified || author?.email === "adelbenmaza3@gmail.com";

  return (
    <Card className="bg-black text-white border-none rounded-none border-b border-zinc-900/50 cursor-pointer active:bg-zinc-950/50 transition-colors" onClick={() => router.push(`/post/${id}`)}>
      <CardHeader className="p-4 pb-2 flex flex-row items-center space-y-0 gap-3">
        <Link href={`/profile/${author?.uid || author?.id || '#'}`} onClick={(e) => e.stopPropagation()}>
          <Avatar className="h-10 w-10 ring-1 ring-zinc-800">
            <AvatarImage src={author?.avatar || author?.photoURL} />
            <AvatarFallback>{author?.name?.[0] || author?.displayName?.[0]}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <Link href={`/profile/${author?.uid || author?.id || '#'}`} onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <h3 className="font-bold text-sm truncate">{author?.name || author?.displayName}</h3>
                  {isAuthorVerified && <VerificationBadge className="h-3.5 w-3.5" />}
                </div>
                <span className="text-[10px] text-zinc-500">@{author?.handle || author?.email?.split('@')[0]}</span>
              </div>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-600"><MoreHorizontal className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-900 text-white rounded-xl">
                <DropdownMenuItem onClick={handleReport} className="flex gap-2 text-orange-500 focus:bg-orange-500/10 focus:text-orange-500 rounded-lg m-1">
                  <Flag className="h-4 w-4" /> {isRtl ? "إبلاغ" : "Report"}
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={handleDelete} className="flex gap-2 text-red-500 focus:bg-red-500/10 focus:text-red-500 rounded-lg m-1">
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
            <Heart className={cn("h-5 w-5 transition-all", isLiked ? "fill-red-500 text-red-500 scale-110" : "text-zinc-500 group-hover:text-red-500/50")} />
            <span className={cn("text-xs font-bold", isLiked ? "text-red-500" : "text-zinc-500")}>{likesCount}</span>
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <div className="flex items-center gap-1.5 group cursor-pointer">
                <MessageCircle className="h-5 w-5 text-zinc-500 group-hover:text-primary/50" />
                <span className="text-xs font-bold text-zinc-500">{comments.length}</span>
              </div>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[75vh] bg-zinc-950 border-zinc-800 rounded-t-[3rem] p-0 outline-none">
              <SheetHeader className="p-6 border-b border-zinc-900">
                <div className="w-12 h-1 bg-zinc-800 rounded-full mx-auto mb-4" />
                <SheetTitle className="text-white font-black text-center">{isRtl ? "النقاشات" : "Discussions"}</SheetTitle>
              </SheetHeader>
              <ScrollArea className="flex-1 p-6 h-[calc(75vh-160px)]">
                {comments.length > 0 ? comments.map((comment: any) => (
                  <div key={comment.id} className="flex gap-4 mb-6 animate-in fade-in slide-in-from-bottom-2">
                    <Avatar className="h-9 w-9"><AvatarImage src={comment.authorAvatar} /></Avatar>
                    <div className="flex-1 bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">@{comment.authorHandle}</p>
                      </div>
                      <p className="text-sm text-zinc-200 leading-relaxed">{comment.text}</p>
                    </div>
                  </div>
                )) : (
                  <div className="py-20 text-center opacity-20">
                    <MessageCircle className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-sm font-bold">{isRtl ? "كن أول من يعلق" : "Be the first to comment"}</p>
                  </div>
                )}
              </ScrollArea>
              <div className="p-4 border-t border-zinc-900 bg-zinc-950 pb-10">
                {isBanned ? (
                  <div className="p-3 text-center text-[10px] text-red-500 font-black uppercase bg-red-500/10 rounded-2xl border border-red-500/20">
                    {isRtl ? "أنت محظور من التعليق حالياً" : "You are restricted from commenting"}
                  </div>
                ) : (
                  <div className="flex gap-2 items-center bg-zinc-900 p-1.5 rounded-full pl-4 border border-zinc-800">
                    <Input 
                      placeholder={isRtl ? "أضف تعليقاً..." : "Add a comment..."} 
                      className="bg-transparent border-none rounded-full h-10 shadow-none focus-visible:ring-0" 
                      value={newComment} 
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <Button size="icon" className="rounded-full h-10 w-10 bg-primary shrink-0" onClick={handleAddComment} disabled={!newComment.trim()}>
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
